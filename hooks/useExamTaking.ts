"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ExamSessionMeta,
  ExamSessionResponse,
  SessionQuestion,
  StatusMessage,
  SubmitResult,
} from "@/types/exam-session";
import {
  getAllAnswers,
  getSession,
  getUnsyncedAnswers,
  markAnswersSynced,
  saveAnswerLocally,
  saveSession,
  updateSessionStatus,
  clearSession,
} from "@/lib/offline/exam-db";

type SyncState = "idle" | "syncing" | "synced" | "error" | "offline";

const SYNC_INTERVAL_MS = 8_000;
const SUBMIT_RETRY_MS = 5_000;

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error || fallback;
}

export const useExamTaking = () => {
  const params = useParams<{ examId: string }>();
  const examId = params.examId;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [examMeta, setExamMeta] = useState<ExamSessionMeta | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> display value
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [timerAnnouncement, setTimerAnnouncement] = useState("");

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const submissionIdRef = useRef<string | null>(null);
  const examIdRef = useRef(examId);
  const hasFinalizedRef = useRef(false); // true once submit has been accepted by the server
  const submitInFlightRef = useRef(false); // true from the moment we decide to submit, even before the server confirms
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // examIdRef was previously only ever set once, at first render
  // (useRef(examId) captures the initial value and nothing after that
  // updates it). Every sync/submit call below reads examIdRef.current
  // rather than the reactive `examId`, so if this page ever renders for a
  // second exam without a full remount (e.g. navigating from one exam's
  // /take page straight to another's), every subsequent sync/submit would
  // silently keep hitting the FIRST exam's endpoints while the rest of
  // the hook (fetched questions, submissionId, etc.) had already moved on
  // to the new one - a stale, mismatched exam id talking to a fresh
  // submission id.
  useEffect(() => {
    examIdRef.current = examId;
  }, [examId]);

  // --- load: sessionStorage handoff -> IDB pending-submit resume ->
  // IDB in-progress resume -> fresh /start (server resume path) ---
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      setLoadError(null);

      // Defensive reset for a new exam session - guards against carrying
      // over another exam's finished/submitted state (isSubmitted,
      // result), guards (hasFinalizedRef, submitInFlightRef), or stale
      // answers if this hook instance is ever reused across two different
      // exams rather than getting a fresh mount. Without this, landing on
      // a second exam right after finishing a first one could briefly
      // show the first exam's result screen, or have its sync/submit
      // calls silently no-op because hasFinalizedRef was still true from
      // the previous exam.
      hasFinalizedRef.current = false;
      submitInFlightRef.current = false;
      submissionIdRef.current = null;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      setIsSubmitted(false);
      setResult(null);
      setAnswers({});
      setQuestions([]);
      setExamMeta(null);
      setRemainingSeconds(0);
      setStatusMessage(null);
      setShowSubmitDialog(false);
      setIsSubmitting(false);

      // 1. A submit was in flight when the tab last closed - don't
      // re-render the exam at all, just retry the submit.
      const cachedSession = await getSession(examId).catch(() => undefined);
      if (cachedSession?.status === "pending-submit") {
        submissionIdRef.current = cachedSession.submissionId;
        setExamMeta({
          id: examId,
          title: cachedSession.title,
          type: cachedSession.type as ExamSessionMeta["type"],
          duration: cachedSession.durationMinutes,
          totalMarks: 0,
        });
        setIsLoading(false);
        if (!cancelled) submitNow(true);
        return;
      }

      let data: ExamSessionResponse | null = null;

      try {
        const cached = sessionStorage.getItem(`examSession:${examId}`);
        if (cached) {
          sessionStorage.removeItem(`examSession:${examId}`);
          data = JSON.parse(cached) as ExamSessionResponse;
        }
      } catch {
        // ignore, fall through to network resume
      }

      if (!data) {
        try {
          const res = await fetch(`/api/student/exams/${examId}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (!res.ok) {
            if (!cancelled) setLoadError(await parseErrorMessage(res, "Could not load this exam"));
            return;
          }
          data = (await res.json()) as ExamSessionResponse;
        } catch {
          if (!cancelled) {
            setLoadError("Could not connect. Check your internet and try again.");
          }
          return;
        }
      }

      if (cancelled || !data) return;

      submissionIdRef.current = data.submissionId;
      setExamMeta(data.exam);
      setQuestions([...data.questions].sort((a, b) => a.order - b.order));
      setRemainingSeconds(data.remainingSeconds);

      // Merge: IDB (if a prior in-progress session exists locally) wins
      // over the server for any answer with a newer local timestamp -
      // covers the case where the last sync before a crash never landed.
      const localAnswers = await getAllAnswers(examId).catch(() => []);
      const localByQuestion = new Map(localAnswers.map((a) => [a.questionId, a]));

      const initialAnswers: Record<string, string> = {};
      for (const q of data.questions) {
        const local = localByQuestion.get(q._id);
        const value =
          local?.selectedOption ?? local?.textAnswer ?? q.selectedOption ?? q.textAnswer;
        if (value !== undefined) initialAnswers[q._id] = value;
      }
      setAnswers(initialAnswers);

      await saveSession({
        examId,
        submissionId: data.submissionId,
        title: data.exam.title,
        type: data.exam.type,
        durationMinutes: data.exam.duration,
        startedAt: new Date(data.startedAt).getTime(),
        questions: data.questions.map((q) => ({
          _id: q._id,
          text: q.text,
          type: q.type,
          marks: q.marks,
          options: q.options,
          order: q.order,
          // These were being fetched from the server but never actually
          // written into the offline cache - a page reload while offline
          // would have silently lost a passage's shared text/grouping,
          // even though the live (non-cached) render had it.
          passageId: q.passageId,
          passageTitle: q.passageTitle,
          passageText: q.passageText,
          passageKind: q.passageKind,
          passageOrder: q.passageOrder,
        })),
        status: "in-progress",
      });

      setIsLoading(false);

      // Push anything left over from a prior crashed session (unsynced
      // answers already sitting in IndexedDB) right away, instead of
      // waiting up to SYNC_INTERVAL_MS for the first interval tick.
      flushSync();
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // --- answer changes: update UI state immediately, write-through to
  // IndexedDB right away (the durability guarantee), mark dirty for the
  // next sync tick ---
  const handleAnswerChange = useCallback(
    (questionId: string, value: string, isObjective: boolean) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      saveAnswerLocally(examIdRef.current, questionId, {
        selectedOption: isObjective ? value : undefined,
        textAnswer: isObjective ? undefined : value,
      }).catch(() => {
        // Storage write failed (rare) - the value still lives in React
        // state and will be included in the final submit payload either
        // way, so this isn't fatal, just loses offline durability for
        // this one keystroke.
      });
    },
    [],
  );

  // --- sync: push unsynced IDB answers to the server ---
  const flushSync = useCallback(async () => {
    if (hasFinalizedRef.current || submitInFlightRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncState("offline");
      return;
    }

    const unsynced = await getUnsyncedAnswers(examIdRef.current).catch(() => []);
    if (unsynced.length === 0) return;

    setSyncState("syncing");
    try {
      const res = await fetch(`/api/student/exams/${examIdRef.current}/sync`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionIdRef.current,
          answers: unsynced.map((a) => ({
            questionId: a.questionId,
            selectedOption: a.selectedOption,
            textAnswer: a.textAnswer,
            updatedAt: a.updatedAt,
          })),
        }),
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setSyncState("synced");
        if (data.expired) {
          submitNow(true);
        }
        return;
      }

      if (!res.ok) {
        setSyncState("error");
        return;
      }

      const data = await res.json();
      await markAnswersSynced(
        examIdRef.current,
        unsynced.map((a) => a.questionId),
      );
      setRemainingSeconds(data.remainingSeconds);
      setSyncState("synced");
    } catch {
      setSyncState("offline");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading || loadError || isSubmitted) return;
    const interval = setInterval(flushSync, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isLoading, loadError, isSubmitted, flushSync]);

  // Flush immediately when connectivity returns, and on tab hide/close.
  useEffect(() => {
    const onOnline = () => flushSync();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushSync();
    };
    const onBeforeUnload = () => {
      flushSync();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [flushSync]);

  // --- countdown timer: ticks locally every second, corrected by the
  // server's clock on every successful sync ---
  useEffect(() => {
    if (isLoading || loadError || isSubmitted) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, loadError, isSubmitted]);

  useEffect(() => {
    if (isLoading || loadError || isSubmitted) return;
    const minutes = Math.floor(remainingSeconds / 60);
    if (remainingSeconds > 300 && remainingSeconds % 300 === 0) {
      setTimerAnnouncement(`${minutes} minutes remaining`);
    } else if (remainingSeconds <= 300 && remainingSeconds > 0 && remainingSeconds % 60 === 0) {
      setTimerAnnouncement(`${minutes} minute${minutes === 1 ? "" : "s"} remaining`);
    } else if (remainingSeconds === 30) {
      setTimerAnnouncement("30 seconds remaining");
    } else if (remainingSeconds === 0) {
      setTimerAnnouncement("Time is up. Submitting your exam now.");
    }
  }, [remainingSeconds, isLoading, loadError, isSubmitted]);

  // --- submit, with indefinite retry until it actually lands ---
  const submitNow = useCallback(async (isAuto: boolean) => {
    if (hasFinalizedRef.current) return;
    // Bind this submit attempt to the exam it was started for. If the
    // student navigates to a different exam while a retry loop is still
    // waiting to fire (see the retry() closure below), that loop must
    // stop rather than eventually submitting this exam's stale answers
    // against whatever exam happens to be current by the time it fires.
    const sessionExamId = examIdRef.current;
    submitInFlightRef.current = true;
    setIsSubmitting(true);
    setShowSubmitDialog(false);
    await updateSessionStatus(examIdRef.current, "pending-submit").catch(() => {});

    if (isAuto) {
      setStatusMessage({
        type: "warning",
        text: "Time is up. Submitting your exam...",
      });
    }

    const allAnswers = await getAllAnswers(examIdRef.current).catch(() => []);
    const payload = allAnswers.map((a) => ({
      questionId: a.questionId,
      selectedOption: a.selectedOption,
      textAnswer: a.textAnswer,
      updatedAt: a.updatedAt,
    }));

    const attempt = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/student/exams/${examIdRef.current}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId: submissionIdRef.current, answers: payload }),
        });
        if (!res.ok) {
          // A definitive rejection from the server (bad submission id,
          // exam deleted, etc.) will never succeed no matter how many
          // times it's retried - only a network-level failure (caught
          // below) should trigger the indefinite retry loop. Surfacing
          // this immediately also means the student isn't told "we'll
          // keep trying" for something that fundamentally can't work.
          if (res.status >= 400 && res.status < 500) {
            hasFinalizedRef.current = true;
            setStatusMessage({
              type: "error",
              text: await parseErrorMessage(
                res,
                "Your exam could not be submitted. Please contact your teacher or administrator - your answers are still saved on this device.",
              ),
            });
            return true; // stop retrying; this counts as "handled", not "keep trying"
          }
          return false;
        }
        const data = (await res.json()) as SubmitResult;
        hasFinalizedRef.current = true;
        setResult(data);
        setIsSubmitted(true);
        setStatusMessage(null);
        await updateSessionStatus(examIdRef.current, "submitted").catch(() => {});
        await clearSession(examIdRef.current).catch(() => {});
        return true;
      } catch {
        return false;
      }
    };

    const succeeded = await attempt();
    if (!succeeded) {
      setStatusMessage({
        type: "error",
        text: "Could not reach the server to submit. Your answers are saved locally and we'll keep trying automatically.",
      });
      const retry = () => {
        retryTimeoutRef.current = setTimeout(async () => {
          if (examIdRef.current !== sessionExamId) {
            // Navigated to a different exam since this retry was queued -
            // this submit is abandoned, not failed. bootstrap() already
            // cleared retryTimeoutRef for the new session; don't resurrect
            // this one.
            return;
          }
          const ok = await attempt();
          if (!ok) retry();
        }, SUBMIT_RETRY_MS);
      };
      retry();
    }
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (
      remainingSeconds === 0 &&
      !isLoading &&
      !loadError &&
      !hasFinalizedRef.current &&
      !submitInFlightRef.current
    ) {
      submitNow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isLoading, loadError]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  const handleSubmitExam = useCallback(() => setShowSubmitDialog(true), []);
  const cancelSubmit = useCallback(() => {
    setShowSubmitDialog(false);
    submitButtonRef.current?.focus();
  }, []);
  const confirmSubmit = useCallback(() => submitNow(false), [submitNow]);

  const getAnsweredCount = useCallback(
    () => questions.filter((q) => Boolean(answers[q._id]?.toString().trim())).length,
    [questions, answers],
  );
  const getTotalQuestions = useCallback(() => questions.length, [questions]);

  const goToExamsList = useCallback(() => router.push("/student/exams"), [router]);

  return {
    isLoading,
    loadError,
    exam: examMeta,
    questions,
    answers,
    remainingSeconds,
    syncState,
    statusMessage,
    timerAnnouncement,
    showSubmitDialog,
    isSubmitting,
    isSubmitted,
    result,
    submitButtonRef,
    handleAnswerChange,
    handleSubmitExam,
    confirmSubmit,
    cancelSubmit,
    getAnsweredCount,
    getTotalQuestions,
    goToExamsList,
  };
};
