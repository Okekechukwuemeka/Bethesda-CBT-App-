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

interface StudentScriptRowProps {
  student: StudentScript;
  showScriptDownload: boolean;
  onDownloadScript: () => void;
}

const StudentScriptRow: React.FC<StudentScriptRowProps> = ({
  student,
  showScriptDownload,
  onDownloadScript,
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

  return (
    <li className="flex flex-col gap-3 bg-white border border-[#E8EEF5] rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Full name always shown (wraps rather than being cut off); the
          details to its right drop underneath on narrow screens. */}
      <div className="min-w-0 sm:flex-1">
        <p className="text-base font-medium text-[#1A3A5C] break-words">{student.studentName}</p>
        <p className="text-sm text-[#5A7A9A]">Admission no: {student.admissionNo}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end sm:flex-shrink-0">
        {student.status === "marked" && (
          <span className="text-sm font-semibold text-[#1A3A5C] whitespace-nowrap">
            {student.score}/{student.totalMarks}{" "}
            <span className="text-xs font-normal text-[#5A7A9A]">({student.percentage}%)</span>
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
    </li>
  );
};

export default StudentScriptRow;
