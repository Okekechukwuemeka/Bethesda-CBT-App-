"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CachedQuestion,
  ExamSessionRecord,
  clearSession,
  getAllAnswers,
  getSession,
  getUnsyncedAnswers,
  markAnswersSynced,
  saveAnswerLocally,
  saveSession,
  updateSessionStatus,
} from "../lib/offline/exam-db";

interface StartExamResponse {
  exam: { id: string; title: string; type: string; duration: number; totalMarks: number };
  submissionId: string;
  questions: CachedQuestion[];
}

type SyncState = "idle" | "syncing" | "offline" | "error";

const SYNC_INTERVAL_MS = 15_000;
const DEBOUNCE_MS = 1_500;

export function useExamSession(examCode: string) {
  const [session, setSession] = useState<ExamSessionRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, { selectedOption?: string; textAnswer?: string }>>(
    {},
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlight = useRef(false);

  // --- Load: cache-first, then reconcile with the server if online -----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = await getSession(examCode);
      if (cached && !cancelled) {
        setSession(cached);
        const cachedAnswers = await getAllAnswers(examCode);
        const answerMap: Record<string, { selectedOption?: string; textAnswer?: string }> = {};
        for (const a of cachedAnswers) {
          answerMap[a.questionId] = { selectedOption: a.selectedOption, textAnswer: a.textAnswer };
        }
        setAnswers(answerMap);
      }

      if (!navigator.onLine) {
        if (!cached) setLoadError("You're offline and this exam hasn't been started on this device yet.");
        return;
      }

      try {
        const res = await fetch(`/api/student/exams/${examCode}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cached) setLoadError(body.error ?? "Could not load this exam.");
          return;
        }
        const data: StartExamResponse = await res.json();
        if (cancelled) return;

        const fresh: ExamSessionRecord = {
          examCode,
          submissionId: data.submissionId,
          examId: data.exam.id,
          title: data.exam.title,
          type: data.exam.type,
          durationMinutes: data.exam.duration,
          // Only set startedAt from the server the first time - never
          // overwrite a cached one, or the timer would reset on every
          // reconnect.
          startedAt: cached?.startedAt ?? Date.now(),
          questions: data.questions,
          status: cached?.status ?? "in-progress",
        };
        await saveSession(fresh);
        setSession(fresh);
      } catch {
        if (!cached) setLoadError("Could not reach the server, and no local copy exists yet.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examCode]);

  // --- Timer: always derived from session.startedAt, ticks locally -----
  useEffect(() => {
    if (!session) return;
    const deadline = session.startedAt + session.durationMinutes * 60_000;

    const tick = () => {
      const secondsLeft = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      if (secondsLeft === 0) submitExam();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.startedAt, session?.durationMinutes]);

  // --- Sync: on interval + on reconnect ---------------------------------
  const syncPending = useCallback(async () => {
    if (!session || syncInFlight.current || !navigator.onLine) return;
    const pending = await getUnsyncedAnswers(examCode);
    if (pending.length === 0) return;

    syncInFlight.current = true;
    setSyncState("syncing");
    try {
      const res = await fetch(`/api/student/exams/${examCode}/sync`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: session.submissionId,
          answers: pending.map((a) => ({
            questionId: a.questionId,
            selectedOption: a.selectedOption,
            textAnswer: a.textAnswer,
            updatedAt: a.updatedAt,
          })),
        }),
      });
      if (res.ok) {
        await markAnswersSynced(
          examCode,
          pending.map((a) => a.questionId),
        );
        setSyncState("idle");
      } else if (res.status === 409) {
        // Already submitted (e.g. on another device) or time expired -
        // stop trying to write further changes.
        setSubmitted(true);
        setSyncState("idle");
      } else {
        setSyncState("error");
      }
    } catch {
      setSyncState("offline");
    } finally {
      syncInFlight.current = false;
    }
  }, [examCode, session]);

  useEffect(() => {
    const interval = setInterval(syncPending, SYNC_INTERVAL_MS);
    window.addEventListener("online", syncPending);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", syncPending);
    };
  }, [syncPending]);

  // --- Answer updates: write-through to IndexedDB immediately -----------
  const setAnswer = useCallback(
    (questionId: string, data: { selectedOption?: string; textAnswer?: string }) => {
      setAnswers((prev) => ({ ...prev, [questionId]: data }));
      // Durable write happens right away, independent of React's render
      // cycle - this is what survives a crash/power loss a second later.
      saveAnswerLocally(examCode, questionId, data);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(syncPending, DEBOUNCE_MS);
    },
    [examCode, syncPending],
  );

  // --- Submit -------------------------------------------------------------
  const submitExam = useCallback(async () => {
    if (!session || submitted) return;
    await updateSessionStatus(examCode, "pending-submit");

    const allAnswers = await getAllAnswers(examCode);
    const payload = {
      submissionId: session.submissionId,
      answers: allAnswers.map((a) => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        textAnswer: a.textAnswer,
        updatedAt: a.updatedAt,
      })),
    };

    const attempt = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/student/exams/${examCode}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return res.ok;
      } catch {
        return false;
      }
    };

    if (await attempt()) {
      setSubmitted(true);
      await clearSession(examCode);
      return;
    }

    // Offline right when submitting: keep the local state marked
    // pending-submit and retry on every reconnect until it lands.
    const retryOnReconnect = async () => {
      if (await attempt()) {
        setSubmitted(true);
        await clearSession(examCode);
        window.removeEventListener("online", retryOnReconnect);
      }
    };
    window.addEventListener("online", retryOnReconnect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examCode, session, submitted]);

  return {
    session,
    questions: session?.questions ?? [],
    answers,
    setAnswer,
    remainingSeconds,
    syncState,
    loadError,
    submitted,
    submitExam,
  };
}
