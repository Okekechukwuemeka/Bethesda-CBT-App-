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
  "not-started": "Not Started",
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

  return (
    <li className="flex items-center justify-between gap-3 bg-white border border-[#E8EEF5] rounded-lg p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#1A3A5C] truncate">{student.studentName}</p>
        <p className="text-xs text-[#5A7A9A]">{student.admissionNo}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {student.status === "marked" && (
          <span className="text-sm font-semibold text-[#1A3A5C]">
            {student.score}/{student.totalMarks}{" "}
            <span className="text-xs font-normal text-[#5A7A9A]">({student.percentage}%)</span>
          </span>
        )}
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[student.status]}`}>
          {statusLabels[student.status]}
        </span>
        {showScriptDownload && hasAnswers && (
          <button
            type="button"
            onClick={onDownloadScript}
            className="text-xs bg-[#E8F0FE] text-[#2B6CB0] font-medium px-3 py-1.5 rounded-lg hover:bg-[#D5E4F7] transition">
            Download Script
          </button>
        )}
      </div>
    </li>
  );
};

export default StudentScriptRow;
