import React from "react";
import type { StudentScript } from "@/types/admin-results";

const statusStyles: Record<string, string> = {
  marked: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  "in-progress": "bg-blue-100 text-blue-800",
  "not-started": "bg-gray-100 text-gray-600",
};

const statusLabels: Record<string, string> = {
  marked: "Marked",
  pending: "Awaiting Marking",
  "in-progress": "In Progress",
  "not-started": "Did Not Take Exam",
};

// What the row needs in order to show a theory-score box. Only passed for a
// student who has submitted a Theory or Mixed exam.
export interface TheoryScoreInput {
  // Text currently in the box (what the marker has typed, or the saved score).
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

interface StudentScriptRowProps {
  student: StudentScript;
  showScriptDownload: boolean;
  onDownloadScript: () => void;
  theoryScoreInput?: TheoryScoreInput;
}

const StudentScriptRow: React.FC<StudentScriptRowProps> = ({
  student,
  showScriptDownload,
  onDownloadScript,
  theoryScoreInput,
}) => {
  const hasAnswers = (student.answers?.length ?? 0) > 0 && student.status !== "not-started";
  // Mixed exam whose theory part is still unmarked: the MCQ half is already
  // auto-scored, so show it instead of leaving the row scoreless.
  const hasMcqScore =
    student.status !== "marked" &&
    student.objectiveScore !== undefined &&
    student.objectiveTotal !== undefined;
  const statusLabel =
    hasMcqScore && student.status === "pending" ? "Theory Awaiting Marking" : statusLabels[student.status];

  // "MCQ 10/15 + Theory 12/15" - shown ahead of the total once marked.
  const roundedTheory =
    student.status === "marked" && student.objectiveScore !== undefined
      ? Math.round((student.score - student.objectiveScore) * 100) / 100
      : student.theoryScore;
  const breakdown =
    student.objectiveScore !== undefined &&
    student.objectiveTotal !== undefined &&
    student.theoryTotal !== undefined &&
    typeof roundedTheory === "number"
      ? `MCQ ${student.objectiveScore}/${student.objectiveTotal} + Theory ${roundedTheory}/${student.theoryTotal}`
      : null;

  const inputId = `theory-score-${student.id}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const showInput = !!theoryScoreInput && student.theoryTotal !== undefined;

  return (
    <li className="bg-white border border-[#E8EEF5] rounded-lg p-4">
      {/* One row: name | scores + status | theory box | download. On narrow
          screens the groups wrap onto the next line instead of squeezing. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-base font-medium text-[#1A3A5C] break-words">{student.studentName}</p>
          <p className="text-sm text-[#5A7A9A]">Admission no: {student.admissionNo}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {student.status === "marked" && (
            <span className="text-sm font-semibold text-[#1A3A5C]">
              {breakdown && (
                <span className="text-xs font-normal text-[#5A7A9A]">{breakdown} = </span>
              )}
              <span className="whitespace-nowrap">
                {student.score}/{student.totalMarks}{" "}
                <span className="text-xs font-normal text-[#5A7A9A]">({student.percentage}%)</span>
              </span>
            </span>
          )}
          {hasMcqScore && (
            <span className="text-sm font-semibold text-[#1A3A5C] whitespace-nowrap">
              <span className="text-xs font-normal text-[#5A7A9A]">MCQ </span>
              {student.objectiveScore}/{student.objectiveTotal}
            </span>
          )}
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${statusStyles[student.status]}`}>
            {statusLabel}
          </span>
        </div>

        {showInput && theoryScoreInput && (
          <div className="flex items-center gap-2">
            <label htmlFor={inputId} className="text-sm font-medium text-[#1A3A5C] whitespace-nowrap">
              Theory
              <span className="sr-only"> score for {student.studentName}</span>
            </label>
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={theoryScoreInput.value}
              disabled={theoryScoreInput.disabled}
              onChange={(e) => theoryScoreInput.onChange(e.target.value)}
              aria-invalid={theoryScoreInput.error ? true : undefined}
              aria-describedby={theoryScoreInput.error ? `${hintId} ${errorId}` : hintId}
              className={`w-20 rounded-lg border px-2 py-2 text-center text-sm text-[#1A3A5C] focus:outline-none focus:ring-2 disabled:opacity-50 ${
                theoryScoreInput.error
                  ? "border-red-400 focus:ring-red-400"
                  : "border-[#C5D8EC] focus:ring-[#2B6CB0]"
              }`}
            />
            <span id={hintId} className="text-sm text-[#5A7A9A] whitespace-nowrap">
              / {student.theoryTotal}
              <span className="sr-only">
                {" "}
                marks available for theory.
                {typeof student.theoryScore === "number" &&
                  " Saved. Change the number and save again to edit it."}
              </span>
            </span>
          </div>
        )}

        {showScriptDownload && hasAnswers && (
          <button
            type="button"
            onClick={onDownloadScript}
            aria-label={`Download script for ${student.studentName}`}
            className="text-sm bg-[#E8F0FE] text-[#2B6CB0] font-medium px-4 py-2 rounded-lg hover:bg-[#D5E4F7] transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] whitespace-nowrap">
            Download Script
          </button>
        )}
      </div>

      {showInput && theoryScoreInput?.error && (
        <p id={errorId} className="mt-2 text-sm font-medium text-red-700">
          {theoryScoreInput.error}
        </p>
      )}
    </li>
  );
};

export default StudentScriptRow;
