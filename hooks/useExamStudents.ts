"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  SaveTheoryScoresResponse,
  StudentScript,
  SubjectResult,
  TheoryScoreEntry,
} from "@/types/admin-results";
import { generateAllTheoryScriptsPDF, generateTheoryScriptPDF } from "@/lib/resultExport";

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error || fallback;
}

// Everything the "Students" page of one exam needs. The same hook serves the
// admin and the teacher page - only the API base differs ("admin" | "staff").
export const useExamStudents = (
  role: "admin" | "staff",
  className: string,
  examId: string,
) => {
  const base = `/api/${role}/results/${encodeURIComponent(className)}`;

  const [subject, setSubject] = useState<SubjectResult | null>(null);
  const [students, setStudents] = useState<StudentScript[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const showStatus = useCallback((message: StatusMessage, durationMs = 4000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), durationMs);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subjectsRes, studentsRes] = await Promise.all([
        fetch(`${base}/subjects`),
        fetch(`${base}/students?examId=${encodeURIComponent(examId)}`),
      ]);
      if (!subjectsRes.ok)
        throw new Error(await parseErrorMessage(subjectsRes, "Failed to load the exam"));
      if (!studentsRes.ok)
        throw new Error(await parseErrorMessage(studentsRes, "Failed to load students"));

      const { subjects } = (await subjectsRes.json()) as { subjects: SubjectResult[] };
      const { students: list } = (await studentsRes.json()) as { students: StudentScript[] };

      const found = subjects.find((s) => s.id === examId) ?? null;
      if (!found) throw new Error("This exam was not found for this class.");
      setSubject(found);
      setStudents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  }, [base, examId]);

  useEffect(() => {
    load();
  }, [load]);

  // Saves typed-in theory marks; the server returns the fresh script list.
  const saveTheoryScores = useCallback(
    async (
      subj: SubjectResult,
      entries: TheoryScoreEntry[],
    ): Promise<SaveTheoryScoresResponse> => {
      setIsSavingScores(true);
      try {
        const res = await fetch(`${base}/scores`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId: subj.id, scores: entries }),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to save theory scores"));
        const data = (await res.json()) as SaveTheoryScoresResponse;
        setStudents(data.students);

        if (data.savedCount > 0) {
          // Refresh the subject numbers quietly (marked count etc.).
          try {
            const r = await fetch(`${base}/subjects`);
            if (r.ok) {
              const { subjects } = (await r.json()) as { subjects: SubjectResult[] };
              const fresh = subjects.find((s) => s.id === subj.id);
              if (fresh) setSubject(fresh);
            }
          } catch {
            /* keep what is on screen */
          }
        }
        return data;
      } finally {
        setIsSavingScores(false);
      }
    },
    [base],
  );

  const downloadScript = useCallback(
    (student: StudentScript) => {
      if (!subject) return;
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
    [className, subject, showStatus],
  );

  const downloadAllScripts = useCallback(() => {
    if (!subject || !students) return;
    try {
      generateAllTheoryScriptsPDF(className, subject, students);
      showStatus({ type: "success", text: `Downloaded all scripts for ${subject.subject}.` });
    } catch {
      showStatus({ type: "error", text: "Failed to export scripts." });
    }
  }, [className, subject, students, showStatus]);

  return {
    subject,
    students,
    isLoading,
    error,
    isSavingScores,
    statusMessage,
    saveTheoryScores,
    downloadScript,
    downloadAllScripts,
    reload: load,
  };
};
