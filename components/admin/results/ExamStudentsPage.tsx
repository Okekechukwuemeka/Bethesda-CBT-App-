"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { StudentScript, TheoryScoreEntry } from "@/types/admin-results";
import { useExamStudents } from "@/hooks/useExamStudents";
import StudentScriptRow from "./StudentScriptRow";

interface ExamStudentsPageProps {
  role: "admin" | "staff";
  className: string;
  examId: string;
  // Where the Back button at the top goes (the class results page).
  backHref: string;
}

interface FeedbackMessage {
  type: "success" | "error";
  text: string;
}

// Accepts "7", "7.5" and "7,5". Returns a number or a message for the row.
function parseScore(raw: string, max: number): { value: number } | { error: string } {
  const normalised = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalised)) {
    return { error: "Enter the score as a number, for example 7 or 7.5." };
  }
  const value = Number(normalised);
  if (value > max) return { error: `The score cannot be more than ${max}.` };
  return { value };
}

// A page of its own (not a dialog): a screen reader starts at the top of the
// page, and the Back button is the first thing there. The main heading takes
// focus on arrival so the reader starts right on it.
const ExamStudentsPage: React.FC<ExamStudentsPageProps> = ({
  role,
  className,
  examId,
  backHref,
}) => {
  const {
    subject,
    students,
    isLoading,
    error,
    isSavingScores,
    statusMessage,
    saveTheoryScores,
    downloadScript,
    downloadAllScripts,
  } = useExamStudents(role, className, examId);

  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const pageTitle = `${className} - Students`;
  useEffect(() => {
    const previous = document.title;
    document.title = subject ? `${subject.subject} - Students - ${className}` : pageTitle;
    return () => {
      document.title = previous;
    };
  }, [subject, className, pageTitle]);

  const showScriptDownload = subject ? subject.examType !== "objective" : false;
  const canEnterScores = !!subject && subject.examType !== "objective";

  // What the marker has typed but not yet saved, keyed by student id.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const savedText = (student: StudentScript) =>
    typeof student.theoryScore === "number" ? String(student.theoryScore) : "";

  // Students whose box differs from what is saved.
  const changedStudents = useMemo(
    () =>
      (students ?? []).filter((s) => {
        if (s.theoryTotal === undefined) return false;
        const draft = drafts[s.id];
        return draft !== undefined && draft.trim() !== savedText(s);
      }),
    [students, drafts],
  );

  // One-line summary so the state of the whole class is read as one sentence.
  const count = (status: StudentScript["status"]) =>
    (students ?? []).filter((s) => s.status === status).length;
  const summary = students
    ? `${students.length} student${students.length !== 1 ? "s" : ""}: ${count("marked")} marked, ${count("pending")} awaiting marking, ${count("in-progress")} still writing, ${count("not-started")} did not take the exam.`
    : "";

  const hasMarkableStudents = (students ?? []).some((s) => s.theoryTotal !== undefined);

  const handleChange = (studentId: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [studentId]: value }));
    setRowErrors((prev) => {
      if (!prev[studentId]) return prev;
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || changedStudents.length === 0) return;

    const entries: TheoryScoreEntry[] = [];
    const localErrors: Record<string, string> = {};
    for (const student of changedStudents) {
      const raw = drafts[student.id].trim();
      if (raw === "") {
        // Emptying a saved score takes the mark back.
        entries.push({ studentId: student.id, theoryScore: null });
        continue;
      }
      const parsed = parseScore(raw, student.theoryTotal ?? 0);
      if ("error" in parsed) localErrors[student.id] = parsed.error;
      else entries.push({ studentId: student.id, theoryScore: parsed.value });
    }

    if (Object.keys(localErrors).length > 0) {
      setRowErrors(localErrors);
      const n = Object.keys(localErrors).length;
      setFeedback({
        type: "error",
        text: `Nothing was saved. ${n} score${n !== 1 ? "s need" : " needs"} fixing - ${n !== 1 ? "they are" : "it is"} marked on the list below.`,
      });
      return;
    }

    try {
      const result = await saveTheoryScores(subject, entries);
      const failedIds = new Set(result.failures.map((f) => f.studentId));

      setDrafts((prev) => {
        const next: Record<string, string> = {};
        for (const id of failedIds) if (prev[id] !== undefined) next[id] = prev[id];
        return next;
      });
      setRowErrors(Object.fromEntries(result.failures.map((f) => [f.studentId, f.error])));

      if (result.failures.length === 0) {
        setFeedback({
          type: "success",
          text: `Saved ${result.savedCount} theory score${result.savedCount !== 1 ? "s" : ""}. The results have been updated.`,
        });
      } else {
        setFeedback({
          type: "error",
          text: `Saved ${result.savedCount}. ${result.failures.length} could not be saved - see the list below.`,
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Could not save the theory scores.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#E8EEF5] px-4 py-2 text-sm font-medium text-[#1A3A5C] transition duration-200 hover:bg-[#D5DFE8] focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {className} Results
        </Link>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold text-[#1A3A5C] focus:outline-none">
            {subject ? `${subject.subject} - Students` : "Students"}
          </h1>
          <p className="text-[#5A7A9A] text-sm">
            {className}
            {subject?.examTitle ? ` - ${subject.examTitle}` : ""}
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          role={statusMessage.type === "error" ? "alert" : "status"}
          aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
          className={`p-4 rounded-lg text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}>
          {statusMessage.text}
        </div>
      )}

      {isLoading ? (
        <p role="status" aria-live="polite" className="text-[#5A7A9A] text-center py-12">
          Loading students…
        </p>
      ) : error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {error}
        </div>
      ) : students && students.length > 0 ? (
        <form
          onSubmit={handleSave}
          className="space-y-4 bg-white rounded-xl border border-[#C5D8EC] p-4 sm:p-6 shadow-sm"
          noValidate
          aria-label={`Students for ${subject?.subject ?? "this exam"}`}>
          <p className="text-sm text-[#4A6A8A]">{summary}</p>
          {canEnterScores && hasMarkableStudents && (
            <p className="text-sm text-[#4A6A8A]">
              The multiple-choice part is scored by the platform. After marking the downloaded
              scripts, type each student&apos;s theory score in the box under their name, then
              choose Save theory scores. A saved script becomes Marked and the results are
              updated.
            </p>
          )}
          {showScriptDownload && (
            <button
              type="button"
              onClick={downloadAllScripts}
              className="w-full sm:w-auto text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500">
              Download All Theory Scripts (PDF)
            </button>
          )}

          {/* Always in the page (even when empty) so a screen reader announces
              the outcome of a save the moment it appears. */}
          <div role={feedback?.type === "error" ? "alert" : "status"} aria-live="polite">
            {feedback && (
              <p
                className={`p-3 rounded-lg text-sm font-medium ${
                  feedback.type === "success"
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}>
                {feedback.text}
              </p>
            )}
          </div>

          <ul className="space-y-3" aria-label="Students">
            {students.map((student) => (
              <StudentScriptRow
                key={student.id}
                student={student}
                showScriptDownload={showScriptDownload}
                onDownloadScript={() => downloadScript(student)}
                theoryScoreInput={
                  canEnterScores && student.theoryTotal !== undefined
                    ? {
                        value: drafts[student.id] ?? savedText(student),
                        error: rowErrors[student.id],
                        disabled: isSavingScores,
                        onChange: (value) => handleChange(student.id, value),
                      }
                    : undefined
                }
              />
            ))}
          </ul>

          {canEnterScores && hasMarkableStudents && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingScores || changedStudents.length === 0}
                className="w-full sm:w-auto bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2.5 rounded-lg transition focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
                {isSavingScores
                  ? "Saving…"
                  : changedStudents.length > 0
                    ? `Save theory scores (${changedStudents.length})`
                    : "Save theory scores"}
              </button>
            </div>
          )}
        </form>
      ) : (
        <p className="text-[#5A7A9A] text-center py-12">No students in this class.</p>
      )}
    </div>
  );
};

export default ExamStudentsPage;
