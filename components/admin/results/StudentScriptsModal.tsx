import React, { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type {
  SaveTheoryScoresResponse,
  StudentScript,
  SubjectResult,
  TheoryScoreEntry,
} from "@/types/admin-results";
import StudentScriptRow from "./StudentScriptRow";

interface StudentScriptsModalProps {
  isOpen: boolean;
  subject: SubjectResult | null;
  students: StudentScript[] | undefined;
  isLoading: boolean;
  onClose: () => void;
  onDownloadScript: (student: StudentScript) => void;
  onDownloadAll: () => void;
  // When given, a theory-score box is shown for every student who has
  // submitted a Theory or Mixed exam, with one button to save them all.
  onSaveTheoryScores?: (
    subject: SubjectResult,
    entries: TheoryScoreEntry[],
  ) => Promise<SaveTheoryScoresResponse>;
  isSavingScores?: boolean;
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

const StudentScriptsModal: React.FC<StudentScriptsModalProps> = ({
  isOpen,
  subject,
  students,
  isLoading,
  onClose,
  onDownloadScript,
  onDownloadAll,
  onSaveTheoryScores,
  isSavingScores = false,
}) => {
  const showScriptDownload = subject ? subject.examType !== "objective" : false;
  const canEnterScores = !!onSaveTheoryScores && !!subject && subject.examType !== "objective";

  // What the marker has typed but not yet saved, keyed by student id.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // A fresh exam (or reopening the dialog) starts with nothing typed. Done
  // while rendering (React's documented way to reset state when a prop
  // changes) rather than in an effect, so no stale boxes flash on screen.
  const resetKey = `${subject?.id ?? ""}|${isOpen}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setDrafts({});
    setRowErrors({});
    setFeedback(null);
  }

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

  // One-line summary so the state of the whole class is clear at a glance
  // (and is read out as a single sentence by a screen reader).
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
    if (!onSaveTheoryScores || !subject || changedStudents.length === 0) return;

    // Check everything on this side first so a typo is pointed out on its
    // own row before anything is sent.
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
      const result = await onSaveTheoryScores(subject, entries);
      const failedIds = new Set(result.failures.map((f) => f.studentId));

      // Saved rows now show the saved value; failed rows keep what was typed.
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={subject ? `${subject.subject} — Students` : "Students"}>
      {isLoading ? (
        <p role="status" aria-live="polite" className="text-[#5A7A9A] text-center py-8">
          Loading students…
        </p>
      ) : students && students.length > 0 ? (
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <p className="text-sm text-[#4A6A8A]">
            {subject?.examTitle ? <strong className="text-[#1A3A5C]">{subject.examTitle}. </strong> : null}
            {summary}
          </p>
          {canEnterScores && hasMarkableStudents && (
            <p className="text-sm text-[#4A6A8A]">
              The multiple-choice part is scored by the platform. After marking the downloaded
              scripts, type each student&apos;s theory score in the box under their name, then
              choose Save theory scores. A saved script becomes Marked and the results above are
              updated.
            </p>
          )}
          {showScriptDownload && (
            <button
              type="button"
              onClick={onDownloadAll}
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

          {/* The dialog itself scrolls, so the list isn't boxed into a second,
              nested scroll area. */}
          <ul className="space-y-3">
            {students.map((student) => (
              <StudentScriptRow
                key={student.id}
                student={student}
                showScriptDownload={showScriptDownload}
                onDownloadScript={() => onDownloadScript(student)}
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
        <p className="text-[#5A7A9A] text-center py-8">No students in this class.</p>
      )}
      <div className="mt-6 flex justify-end border-t border-[#E8EEF5] pt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium px-6 py-2.5 rounded-lg transition focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
          Close
        </button>
      </div>
    </Modal>
  );
};

export default StudentScriptsModal;
