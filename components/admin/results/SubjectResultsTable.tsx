import React from "react";
import type { SubjectResult } from "@/types/admin-results";
import StatusBadge from "./StatusBadge";
import ExamTypeBadge from "./ExamTypeBadge";

interface SubjectResultsTableProps {
  subjects: SubjectResult[];
  className: string;
  exportingId: string | null;
  onExportExcel: (subject: SubjectResult) => void;
  onExportAllScripts: (subject: SubjectResult) => void;
  onViewScripts: (subject: SubjectResult, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const SubjectResultsTable: React.FC<SubjectResultsTableProps> = ({
  subjects,
  className,
  exportingId,
  onExportExcel,
  onExportAllScripts,
  onViewScripts,
}) => {
  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#C5D8EC] p-12 text-center">
        <p className="text-[#5A7A9A] font-medium">No exams found for {className} yet.</p>
      </div>
    );
  }

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
                Marked
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EEF5]">
            {subjects.map((subject) => {
              // "mixed" exams need BOTH buttons - a single label switch
              // based only on `=== "theory"` silently drops one of them.
              const showExcelExport = subject.examType !== "theory";
              const showScriptExport = subject.examType !== "objective";
              const isExporting = exportingId === subject.id;

              return (
                <tr key={subject.id} className="hover:bg-[#F8FAFE] transition">
                  <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">
                    {subject.subject}
                    <p className="text-xs font-normal text-[#8A9CAE]">{subject.examTitle}</p>
                  </td>
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
                      {showExcelExport && (
                        <button
                          onClick={() => onExportExcel(subject)}
                          disabled={isExporting}
                          aria-label={`Download spreadsheet results for ${subject.subject}`}
                          className="text-sm bg-[#1A3A5C] hover:bg-[#14304D] text-white px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] disabled:opacity-50">
                          {isExporting ? "Preparing..." : "Download Results"}
                        </button>
                      )}
                      {showScriptExport && (
                        <button
                          onClick={() => onExportAllScripts(subject)}
                          disabled={isExporting}
                          aria-label={`Download all student scripts for ${subject.subject}`}
                          className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50">
                          {isExporting ? "Preparing..." : "Download Scripts"}
                        </button>
                      )}
                      <button
                        onClick={(e) => onViewScripts(subject, e)}
                        aria-label={`View students for ${subject.subject}`}
                        className="text-sm bg-[#E8F0FE] hover:bg-[#D5E4F7] text-[#2B6CB0] px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
                        View Students
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectResultsTable;
