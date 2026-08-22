"use client";

import { useState, useEffect, useCallback } from "react";
import { Exam } from "../types/exam.types";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

export const useExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  // Delete confirmation lives in the hook (not the page/list component) so
  // any component rendering the exams list can trigger it the same way,
  // without each one re-implementing its own confirm dialog.
  const [examPendingDelete, setExamPendingDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [forceDeleteWarning, setForceDeleteWarning] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/exams");
      if (!res.ok) throw new Error("Failed to load exams");
      const { exams: apiExams } = await res.json();
      setExams(
        apiExams.map((e: any) => ({
          id: e._id,
          title: e.title,
          subject: {
            id: e.subject?._id,
            name: e.subject?.name ?? "Unknown",
            code: e.subject?.code ?? "",
          },
          class: e.class,
          classes: e.classes,
          isGeneral: e.isGeneral,
          term: e.term,
          academicYear: e.academicYear,
          examDate: e.examDate,
          duration: e.duration,
          type: e.type,
          questionCount: e.questionCount,
          totalMarks: e.totalMarks,
          status: e.status,
          examCode: e.examCode,
          isCodeActive: e.isCodeActive,
          instructions: e.instructions,
          passingScore: e.passingScore,
          shuffleQuestions: e.shuffleQuestions,
        })),
      );
    } catch {
      setError("Failed to fetch exams");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const requestDelete = useCallback((exam: Exam) => {
    setExamPendingDelete(exam);
    setForceDeleteWarning(null);
  }, []);

  const cancelDelete = useCallback(() => {
    setExamPendingDelete(null);
    setForceDeleteWarning(null);
  }, []);

  // force=true is only ever sent as a deliberate second step, after the
  // admin has already seen and acknowledged the "N submissions exist"
  // warning below - never sent on the first attempt.
  const performDelete = useCallback(
    async (force = false) => {
      if (!examPendingDelete) return;
      setIsDeleting(true);
      try {
        const res = await fetch(
          `/api/admin/exams/${examPendingDelete.id}${force ? "?force=true" : ""}`,
          { method: "DELETE" },
        );
        const body = await res.json().catch(() => ({}));

        if (res.status === 409 && !force) {
          // Backend refused because submissions exist - surface that as an
          // explicit second confirmation rather than silently failing.
          // Built from submissionCount rather than passing body.error
          // straight through: the API message is written for a developer
          // ("Pass ?force=true to delete anyway") and isn't something an
          // admin using the UI should ever see verbatim.
          const count = typeof body.submissionCount === "number" ? body.submissionCount : null;
          setForceDeleteWarning(
            count !== null
              ? `This exam has ${count} student submission${count !== 1 ? "s" : ""}.`
              : "This exam has student submissions attached to it.",
          );
          setIsDeleting(false);
          return;
        }

        if (!res.ok) throw new Error(body.error ?? "Failed to delete exam");

        setExams((prev) => prev.filter((e) => e.id !== examPendingDelete.id));
        setStatusMessage({ type: "success", text: `"${examPendingDelete.title}" was deleted.` });
        setExamPendingDelete(null);
        setForceDeleteWarning(null);
      } catch (err) {
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to delete exam.",
        });
      } finally {
        setIsDeleting(false);
      }
    },
    [examPendingDelete],
  );

  return {
    exams,
    isLoading,
    error,
    statusMessage,
    fetchExams,
    examPendingDelete,
    isDeleting,
    forceDeleteWarning,
    requestDelete,
    cancelDelete,
    performDelete,
  };
};
