"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { StudentScript, SubjectResult } from "@/types/admin-results";
import {
  generateObjectiveExcel,
  generateAllTheoryScriptsPDF,
  generateTheoryScriptPDF,
} from "@/lib/resultExport";

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error || fallback;
}

// Same shape as hooks/useClassResults, scoped to /api/staff/results so a
// teacher only ever sees subjects they're assigned. There's no
// exportClassResults here - "all subjects in the class" isn't a thing a
// teacher should be pulling, only admins get that cross-subject export.
export const useTeacherClassResults = (className: string) => {
  const [subjects, setSubjects] = useState<SubjectResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const [studentsByExam, setStudentsByExam] = useState<Record<string, StudentScript[]>>({});
  const [loadingStudentsFor, setLoadingStudentsFor] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<SubjectResult | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [exportingId, setExportingId] = useState<string | null>(null);

  const showStatus = useCallback((message: StatusMessage, durationMs = 4000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), durationMs);
  }, []);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    setSubjectsError(null);
    try {
      const res = await fetch(`/api/staff/results/${encodeURIComponent(className)}/subjects`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load subject results"));
      const { subjects: data } = await res.json();
      setSubjects(data);
    } catch (err) {
      setSubjectsError(err instanceof Error ? err.message : "Failed to load subject results.");
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
      setStudentsError(null);
      try {
        const res = await fetch(
          `/api/staff/results/${encodeURIComponent(className)}/students?examId=${examId}`,
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
      } catch {
        // handled inside ensureStudentsLoaded
      }
    },
    [ensureStudentsLoaded],
  );

  const closeScriptModal = useCallback(() => {
    setShowScriptModal(false);
    setSelectedSubject(null);
    setStudentsError(null);
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
    [showStatus],
  );

  return {
    className,
    subjects,
    isLoading,
    subjectsError,
    studentsError,
    statusMessage,
    studentsByExam,
    loadingStudentsFor,
    selectedSubject,
    showScriptModal,
    triggerRef,
    exportingId,
    handleViewScripts,
    closeScriptModal,
    exportExcel,
    exportAllScripts,
    exportSingleScript,
  };
};
