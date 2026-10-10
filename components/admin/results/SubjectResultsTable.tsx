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
  // Only the admin page passes these. Teachers can view results of a deleted
  // exam but never delete them, so without them no delete button is shown.
  onDeleteResults?: (subject: SubjectResult, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const headerClass =
  "px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider whitespace-nowrap";

// Every action button is the same size and fills its grid cell, so they line
// up in tidy columns instead of ragged, differently-sized stacks.
const buttonBase =
  "w-full text-sm font-medium text-center px-3 py-2 rounded-lg transition focus:outline-none focus:ring-2 disabled:opacity-50";

const SubjectResultsTable: React.FC<SubjectResultsTableProps> = ({
  subjects,
  className,
  exportingId,
  onExportExcel,
  onExportAllScripts,
  onViewScripts,
  onDeleteResults,
}) => {
  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#C5D8EC] p-12 text-center">
        <p className="text-[#5A7A9A] font-medium">No exams found for {className} yet.</p>
      </div>
    );
  }

  const highLow = (subject: SubjectResult) =>
    subject.completed > 0
      ? `${subject.highestScore}/${subject.totalMarks} — ${subject.lowestScore}/${subject.totalMarks}`
      : "—";

<<<<<<< HEAD
  const deletedNote = (subject: SubjectResult) =>
    subject.examDeleted ? (
      <p className="mt-1 text-xs font-normal text-[#8A9CAE]">
        <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 font-medium text-gray-700">
          Exam deleted
        </span>{" "}
        {[subject.term, subject.academicYear].filter(Boolean).join(" · ")}
      </p>
    ) : null;

  // The same four buttons in the table and in the cards, so there is only
  // one place to change them.
  const actions = (subject: SubjectResult) => {
    // "mixed" exams need BOTH buttons - a single label switch
    // based only on `=== "theory"` silently drops one of them.
    const showExcelExport = subject.examType !== "theory";
    const showScriptExport = subject.examType !== "objective";
    const isExporting = exportingId === subject.id;

    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
        <button
          type="button"
          onClick={(e) => onViewScripts(subject, e)}
          aria-label={`View students for ${subject.subject}, ${subject.examTitle}`}
          className={`${buttonBase} bg-[#E8F0FE] hover:bg-[#D5E4F7] text-[#2B6CB0] focus:ring-[#2B6CB0]`}>
          View Students
        </button>
        {showExcelExport && (
          <button
            type="button"
            onClick={() => onExportExcel(subject)}
            disabled={isExporting}
            aria-label={`Download spreadsheet results for ${subject.subject}, ${subject.examTitle}`}
            className={`${buttonBase} bg-[#1A3A5C] hover:bg-[#14304D] text-white focus:ring-[#2B6CB0]`}>
            {isExporting ? "Preparing..." : "Download Results"}
          </button>
        )}
        {showScriptExport && (
          <button
            type="button"
            onClick={() => onExportAllScripts(subject)}
            disabled={isExporting}
            aria-label={`Download all student scripts for ${subject.subject}, ${subject.examTitle}`}
            className={`${buttonBase} bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500`}>
            {isExporting ? "Preparing..." : "Download Scripts"}
          </button>
        )}
        {subject.examDeleted && onDeleteResults && (
          <button
            type="button"
            onClick={(e) => onDeleteResults(subject, e)}
            aria-label={`Delete saved results for ${subject.subject}, ${subject.examTitle}`}
            className={`${buttonBase} bg-red-50 hover:bg-red-100 text-red-700 focus:ring-red-500`}>
            Delete Results
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Wide screens: a table. `hidden` removes the other layout from the
          accessibility tree too, so a screen reader meets each exam once. */}
      <div className="hidden lg:block bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <caption className="sr-only">Subject results for {className}</caption>
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[15%]" />
              <col className="w-[20%]" />
              <col className="w-[35%]" />
            </colgroup>
            <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
              <tr>
                <th scope="col" className={headerClass}>
                  Subject and exam
                </th>
                <th scope="col" className={headerClass}>
                  Status
                </th>
                <th scope="col" className={headerClass}>
                  Results
                </th>
                <th scope="col" className={headerClass}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EEF5]">
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-[#F8FAFE] transition align-top">
                  <td className="px-4 py-4">
                    <p className="text-base font-semibold text-[#1A3A5C] break-words">
                      {subject.subject}
                    </p>
                    <p className="text-sm text-[#5A7A9A] break-words">{subject.examTitle}</p>
                    <div className="mt-2">
                      <ExamTypeBadge type={subject.examType} />
                    </div>
                    {deletedNote(subject)}
=======
              return (
                <tr key={subject.id} className="hover:bg-[#F8FAFE] transition">
                  <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">
                    {subject.subject}
                    <p className="text-xs font-normal text-[#8A9CAE]">{subject.examTitle}</p>
                    {subject.examDeleted && (
                      <p className="mt-1 text-xs font-normal text-[#8A9CAE]">
                        <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 font-medium text-gray-700">
                          Exam deleted
                        </span>{" "}
                        {[subject.term, subject.academicYear].filter(Boolean).join(" · ")}
                      </p>
                    )}
>>>>>>> dec5f6225600b421121f5d76dd0fbeba598d6227
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={subject.status} />
                  </td>
<<<<<<< HEAD
                  <td className="px-4 py-4 text-sm">
                    <p className="text-[#1A3A5C] font-medium">
                      {subject.completed} of {subject.totalStudents} marked
                    </p>
                    <p className="text-[#5A7A9A]">
                      <span className="sr-only">Highest and lowest score: </span>
                      <span aria-hidden="true">High/Low: </span>
                      {highLow(subject)}
                    </p>
=======
                  <td className="px-4 py-3 text-sm text-[#4A6A8A]">
                    {subject.completed > 0
                      ? `${subject.highestScore}/${subject.totalMarks} — ${subject.lowestScore}/${subject.totalMarks}`
                      : "—"}
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
                      {subject.examDeleted && onDeleteResults && (
                        <button
                          onClick={(e) => onDeleteResults(subject, e)}
                          aria-label={`Delete saved results for ${subject.subject}, ${subject.examTitle}`}
                          className="text-sm bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-500">
                          Delete Results
                        </button>
                      )}
                    </div>
>>>>>>> dec5f6225600b421121f5d76dd0fbeba598d6227
                  </td>
                  <td className="px-4 py-4">{actions(subject)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phones and tablets: one card per exam, with room for the buttons. */}
      <ul className="lg:hidden grid grid-cols-1 gap-4 md:grid-cols-2" aria-label={`Subject results for ${className}`}>
        {subjects.map((subject) => (
          <li
            key={subject.id}
            className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#1A3A5C] break-words">
                {subject.subject}
              </h3>
              <p className="text-sm text-[#5A7A9A] break-words">{subject.examTitle}</p>
              {deletedNote(subject)}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExamTypeBadge type={subject.examType} />
              <StatusBadge status={subject.status} />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-[#5A7A9A]">High/Low</dt>
                <dd className="text-[#1A3A5C] font-medium">{highLow(subject)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-[#5A7A9A]">Marked</dt>
                <dd className="text-[#1A3A5C] font-medium">
                  {subject.completed}/{subject.totalStudents}
                </dd>
              </div>
            </dl>

            {actions(subject)}
          </li>
        ))}
      </ul>
    </>
  );
};

export default SubjectResultsTable;
