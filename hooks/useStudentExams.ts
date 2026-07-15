"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Exam, StatusMessage } from "@/types/student-exam";

interface ApiErrorPayload {
  error?: string;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data: ApiErrorPayload = await res.json().catch(() => ({}));
  return data.error || fallback;
}

export const useStudentExams = () => {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examCode, setExamCode] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const examTriggerRef = useRef<HTMLElement | null>(null);

  const fetchExams = useCallback(async () => {
    setIsLoadingExams(true);
    setExamsError(null);
    try {
      const res = await fetch("/api/student/exams");
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load examinations"));
      const { exams: apiExams } = await res.json();
      setExams(apiExams);
    } catch (err) {
      setExamsError(err instanceof Error ? err.message : "Failed to load examinations.");
    } finally {
      setIsLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleExamClick = useCallback((exam: Exam, e: React.MouseEvent<HTMLButtonElement>) => {
    examTriggerRef.current = e.currentTarget;
    setSelectedExam(exam);
    setExamCode("");
    setStatusMessage(null);
    setIsCodeVerified(false);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    if (isVerifying || isCodeVerified) return;
    setIsModalOpen(false);
    setSelectedExam(null);
    setExamCode("");
    setStatusMessage(null);
    examTriggerRef.current?.focus();
  }, [isVerifying, isCodeVerified]);

  const handleCodeSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedExam || isVerifying) return;

      if (!examCode.trim()) {
        setStatusMessage({ type: "error", text: "Please enter the exam code." });
        return;
      }

      setIsVerifying(true);
      setStatusMessage(null);
      try {
        // /start both verifies the code AND creates the Submission on the
        // first successful call - there's no separate verify step. Once a
        // Submission exists, calling /start again (from the exam-taking
        // page, with no code) just resumes it.
        const res = await fetch(`/api/student/exams/${selectedExam.id}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: examCode.trim() }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatusMessage({ type: "error", text: data.error || "Invalid exam code." });
          return;
        }

        setStatusMessage({ type: "success", text: "Code verified. Starting your exam..." });
        setIsCodeVerified(true);

        // Brief pause so the "Verified ✓" state is actually visible before
        // navigating away to the exam-taking page.
        setTimeout(() => {
          router.push(`/student/exams/${selectedExam.id}/take`);
        }, 900);
      } catch {
        setStatusMessage({ type: "error", text: "Something went wrong. Please try again." });
      } finally {
        setIsVerifying(false);
      }
    },
    [selectedExam, examCode, isVerifying, router],
  );

  return {
    exams,
    isLoadingExams,
    examsError,
    selectedExam,
    examCode,
    isModalOpen,
    statusMessage,
    isCodeVerified,
    isVerifying,
    setExamCode,
    handleExamClick,
    handleModalClose,
    handleCodeSubmit,
    refetchExams: fetchExams,
  };
};
