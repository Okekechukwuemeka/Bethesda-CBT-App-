import React from "react";
import StatusBadge from "./StatusBadge";
import ExamTypeBadge from "./ExamTypeBadge";

interface SubjectResult {
  id: number;
  subject: string;
  examType: "objective" | "theory" | "mixed";
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completed: number;
  status: "completed" | "pending" | "in-progress";
}

interface SubjectResultsTableProps {
  subjectResults: SubjectResult[];
  className: string;
  isLoading: boolean;
  onDownloadResult: (subject: SubjectResult) => void;
  onViewScripts: (subject: SubjectResult, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const SubjectResultsTable: React.FC<SubjectResultsTableProps> = ({
  subjectResults,
  className,
  isLoading,
  onDownloadResult,
  onViewScripts,
}) => {
  return (
    <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">Subject results for {className}</caption>
          <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Subject
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Type
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Avg Score
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                High/Low
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Completed
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EEF5]">
            {subjectResults.map((subject) => (
              <tr key={subject.id} className="hover:bg-[#F8FAFE] transition">
                <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">{subject.subject}</td>
                <td className="px-4 py-3">
                  <ExamTypeBadge type={subject.examType} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={subject.status} />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">
                  {subject.averageScore}%
                </td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A]">
                  {subject.highestScore}% / {subject.lowestScore}%
                </td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A]">
                  {subject.completed}/{subject.totalStudents}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onDownloadResult(subject)}
                      disabled={isLoading}
                      aria-label={
                        subject.examType === "theory"
                          ? `Download all student scripts for ${subject.subject}`
                          : `Download spreadsheet results for ${subject.subject}`
                      }
                      className="text-sm bg-[#1A3A5C] hover:bg-[#14304D] text-white px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] disabled:opacity-50">
                      {subject.examType === "theory" ? "Download Scripts" : "Download Results"}
                    </button>
                    {subject.examType === "theory" && (
                      <button
                        onClick={(e) => onViewScripts(subject, e)}
                        aria-label={`View student scripts for ${subject.subject}`}
                        className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500">
                        View Scripts
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectResultsTable;
