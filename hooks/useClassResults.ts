"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type {
  ClassExportRow,
  SaveTheoryScoresResponse,
  StudentScript,
  SubjectResult,
  TheoryScoreEntry,
} from "@/types/admin-results";
import {
  generateObjectiveExcel,
  generateAllTheoryScriptsPDF,
  generateTheoryScriptPDF,
  generateResultsCsv,
  generateClassResultsCsv,
  generateClassResultsExcel,
} from "@/lib/resultExport";

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error || `${fallback} (server returned ${res.status})`;
}

export const useClassResults = (className: string) => {
  const [subjects, setSubjects] = useState<SubjectResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FIX: Split the ambiguous error state into descriptive contexts
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const [studentsByExam, setStudentsByExam] = useState<Record<string, StudentScript[]>>({});
  const [loadingStudentsFor, setLoadingStudentsFor] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<SubjectResult | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [exportingId, setExportingId] = useState<string | null>(null);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [isExportingClass, setIsExportingClass] = useState(false);

  // Deleting the saved results of an exam that was itself already deleted.
  const [resultsPendingDelete, setResultsPendingDelete] = useState<SubjectResult | null>(null);
  const [isDeletingResults, setIsDeletingResults] = useState(false);

  const showStatus = useCallback((message: StatusMessage, durationMs = 4000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), durationMs);
  }, []);

  // `silent` refreshes the numbers (stats cards, status badges) without
  // swapping the whole page for the "Loading exams..." message - used after a
  // save so the screen doesn't flicker or lose its place.
  const fetchSubjects = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoading(true);
        setSubjectsError(null);
      }
      try {
        const res = await fetch(`/api/admin/results/${encodeURIComponent(className)}/subjects`);
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load subject results"));
        const { subjects: data } = await res.json();
        setSubjects(data);
      } catch (err) {
        // A failed background refresh keeps the numbers already on screen.
        if (!silent) {
          setSubjectsError(err instanceof Error ? err.message : "Failed to load subject results.");
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [className],
  );

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const ensureStudentsLoaded = useCallback(
    async (examId: string): Promise<StudentScript[]> => {
      if (studentsByExam[examId]) return studentsByExam[examId];

      setLoadingStudentsFor(examId);
      setStudentsError(null);
      try {
        // ✅ FIX: Pointing to your actual API path structure and appending examId as a query parameter
        const res = await fetch(
          `/api/admin/results/${encodeURIComponent(className)}/students?examId=${examId}`,
        );
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load students"));
        const { students } = await res.json();
        setStudentsByExam((prev) => ({ ...prev, [examId]: students }));
        return students as StudentScript[];
      } catch (err) {
        setStudentsError(err instanceof Error ? err.message : "Failed to load students.");
        throw err;
      } finally {
        setLoadingStudentsFor(null);
      }
    },
    [className, studentsByExam],
  );

  const handleViewScripts = useCallback(
    async (subject: SubjectResult, e: React.MouseEvent<HTMLButtonElement>) => {
      triggerRef.current = e.currentTarget;
      setSelectedSubject(subject);
      setShowScriptModal(true);
      try {
        await ensureStudentsLoaded(subject.id);
      } catch (err) {
        // Handled within ensureStudentsLoaded error catch block
      }
    },
    [ensureStudentsLoaded],
  );

  const closeScriptModal = useCallback(() => {
    setShowScriptModal(false);
    setSelectedSubject(null);
    setStudentsError(null); // Clear active modal error streams on close
  }, []);

  const exportExcel = useCallback(
    async (subject: SubjectResult) => {
      setExportingId(subject.id);
      try {
        const students = await ensureStudentsLoaded(subject.id);
        await generateObjectiveExcel(className, subject, students);
        showStatus({ type: "success", text: `Downloaded ${subject.subject} results.` });
      } catch (err) {
        showStatus({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to export results.",
        });
      } finally {
        setExportingId(null);
      }
    },
    [className, ensureStudentsLoaded, showStatus],
  );

  const exportCsv = useCallback(
    async (subject: SubjectResult) => {
      setExportingId(subject.id);
      try {
        const students = await ensureStudentsLoaded(subject.id);
        generateResultsCsv(className, subject, students);
        showStatus({ type: "success", text: `Downloaded the ${subject.subject} CSV.` });
      } catch (err) {
        showStatus({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to export the CSV.",
        });
      } finally {
        setExportingId(null);
      }
    },
    [className, ensureStudentsLoaded, showStatus],
  );

  const exportAllScripts = useCallback(
    async (subject: SubjectResult) => {
      setExportingId(subject.id);
      try {
        const students = await ensureStudentsLoaded(subject.id);
        generateAllTheoryScriptsPDF(className, subject, students);
        showStatus({ type: "success", text: `Downloaded all scripts for ${subject.subject}.` });
      } catch (err) {
        showStatus({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to export scripts.",
        });
      } finally {
        setExportingId(null);
      }
    },
    [className, ensureStudentsLoaded, showStatus],
  );

  const exportSingleScript = useCallback(
    (subject: SubjectResult, student: StudentScript) => {
      try {
        generateTheoryScriptPDF(className, subject, student);
        showStatus({
          type: "success",
          text: `Downloaded script for ${student.studentName} (${student.admissionNo}).`,
        });
      } catch {
        showStatus({ type: "error", text: "Could not generate the script PDF." });
      }
    },
    [className, showStatus],
  );

  const exportClassResults = useCallback(async () => {
    setIsExportingClass(true);
    try {
      const res = await fetch(`/api/admin/results/${encodeURIComponent(className)}/export`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to prepare class export"));
      const { subjects: exportSubjects, scoresBySubject } = (await res.json()) as {
        subjects: SubjectResult[];
        scoresBySubject: Record<string, ClassExportRow[]>;
      };
      await generateClassResultsExcel(className, exportSubjects, scoresBySubject);
      showStatus({ type: "success", text: `Downloaded results for all subjects in ${className}.` });
    } catch (err) {
      showStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to export class results.",
      });
    } finally {
      setIsExportingClass(false);
    }
  }, [className, showStatus]);

  const exportClassCsv = useCallback(async () => {
    setIsExportingClass(true);
    try {
      const res = await fetch(`/api/admin/results/${encodeURIComponent(className)}/export`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to prepare class export"));
      const { subjects: exportSubjects, scoresBySubject } = (await res.json()) as {
        subjects: SubjectResult[];
        scoresBySubject: Record<string, ClassExportRow[]>;
      };
      generateClassResultsCsv(className, exportSubjects, scoresBySubject);
      showStatus({ type: "success", text: `Downloaded the CSV for all subjects in ${className}.` });
    } catch (err) {
      showStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to export the class CSV.",
      });
    } finally {
      setIsExportingClass(false);
    }
  }, [className, showStatus]);

  const requestDeleteResults = useCallback((subject: SubjectResult) => {
    setResultsPendingDelete(subject);
  }, []);

  const cancelDeleteResults = useCallback(() => {
    if (isDeletingResults) return;
    setResultsPendingDelete(null);
  }, [isDeletingResults]);

  const confirmDeleteResults = useCallback(async () => {
    if (!resultsPendingDelete) return;
    const target = resultsPendingDelete;
    setIsDeletingResults(true);
    try {
      const res = await fetch(
        `/api/admin/results/${encodeURIComponent(className)}/exams/${target.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to delete results"));

      setSubjects((prev) => prev.filter((s) => s.id !== target.id));
      setStudentsByExam((prev) => {
        const next = { ...prev };
        delete next[target.id];
        return next;
      });
      setResultsPendingDelete(null);
      showStatus({
        type: "success",
        text: `Deleted the saved results for ${target.subject} (${target.examTitle}).`,
      });
    } catch (err) {
      setResultsPendingDelete(null);
      showStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete results.",
      });
    } finally {
      setIsDeletingResults(false);
    }
  }, [className, resultsPendingDelete, showStatus]);

  // Saves the theory marks a teacher/admin typed in. The server marks each
  // saved script as Marked and hands back the class's fresh script list; that
  // replaces the cached list (so the dialog and the exports show the new
  // scores), and the subject rows are re-fetched so the stats cards and status
  // badges move from "Awaiting Marking" towards "Completed". Throws on a
  // request-level failure so the dialog can show it next to the form.
  const saveTheoryScores = useCallback(
    async (subject: SubjectResult, entries: TheoryScoreEntry[]): Promise<SaveTheoryScoresResponse> => {
      setIsSavingScores(true);
      try {
        const res = await fetch(`/api/admin/results/${encodeURIComponent(className)}/scores`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId: subject.id, scores: entries }),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to save theory scores"));
        const data = (await res.json()) as SaveTheoryScoresResponse;

        setStudentsByExam((prev) => ({ ...prev, [subject.id]: data.students }));
        if (data.savedCount > 0) await fetchSubjects(true);
        return data;
      } finally {
        setIsSavingScores(false);
      }
    },
    [className, fetchSubjects],
  );

  return {
    className,
    subjects,
    resultsPendingDelete,
    isDeletingResults,
    requestDeleteResults,
    cancelDeleteResults,
    confirmDeleteResults,
    isLoading,
    subjectsError, // ✅ Updated
    studentsError, // ✅ Updated
    statusMessage,
    studentsByExam,
    loadingStudentsFor,
    selectedSubject,
    showScriptModal,
    triggerRef,
    exportingId,
    isExportingClass,
    isSavingScores,
    saveTheoryScores,
    handleViewScripts,
    closeScriptModal,
    exportExcel,
    exportCsv,
    exportAllScripts,
    exportSingleScript,
    exportClassResults,
    exportClassCsv,
  };
};
