"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ClassExportRow, StudentScript, SubjectResult } from "@/types/admin-results";
import {
  generateObjectiveExcel,
  generateAllTheoryScriptsPDF,
  generateTheoryScriptPDF,
  generateClassResultsExcel,
} from "@/lib/resultExport";

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error || fallback;
}

export const useClassResults = (className: string) => {
  const [subjects, setSubjects] = useState<SubjectResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  // Full per-student rows (with theory answers) are only fetched when
  // actually needed - opening the scripts modal, or exporting - then
  // cached by examId so re-opening/re-exporting doesn't refetch.
  const [studentsByExam, setStudentsByExam] = useState<Record<string, StudentScript[]>>({});
  const [loadingStudentsFor, setLoadingStudentsFor] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<SubjectResult | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [exportingId, setExportingId] = useState<string | null>(null);
  const [isExportingClass, setIsExportingClass] = useState(false);

  const showStatus = useCallback((message: StatusMessage, durationMs = 4000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), durationMs);
  }, []);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/results/${encodeURIComponent(className)}/subjects`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load subject results"));
      const { subjects: data } = await res.json();
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subject results.");
    } finally {
      setIsLoading(false);
    }
  }, [className]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const ensureStudentsLoaded = useCallback(
    async (examId: string): Promise<StudentScript[]> => {
      if (studentsByExam[examId]) return studentsByExam[examId];

      setLoadingStudentsFor(examId);
      try {
        const res = await fetch(`/api/admin/results/exams/${examId}/students`);
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load students"));
        const { students } = await res.json();
        setStudentsByExam((prev) => ({ ...prev, [examId]: students }));
        return students as StudentScript[];
      } finally {
        setLoadingStudentsFor(null);
      }
    },
    [studentsByExam],
  );

  const handleViewScripts = useCallback(
    async (subject: SubjectResult, e: React.MouseEvent<HTMLButtonElement>) => {
      triggerRef.current = e.currentTarget;
      setSelectedSubject(subject);
      setShowScriptModal(true);
      try {
        await ensureStudentsLoaded(subject.id);
      } catch (err) {
        showStatus({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to load students.",
        });
      }
    },
    [ensureStudentsLoaded, showStatus],
  );

  const closeScriptModal = useCallback(() => {
    setShowScriptModal(false);
    setSelectedSubject(null);
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

  return {
    className,
    subjects,
    isLoading,
    error,
    statusMessage,
    studentsByExam,
    loadingStudentsFor,
    selectedSubject,
    showScriptModal,
    triggerRef,
    exportingId,
    isExportingClass,
    handleViewScripts,
    closeScriptModal,
    exportExcel,
    exportAllScripts,
    exportSingleScript,
    exportClassResults,
  };
};
