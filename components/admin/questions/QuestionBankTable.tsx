import React, { useMemo } from "react";
import type { Question, Subject } from "@/types/question";

interface QuestionBankTableProps {
  questions: Question[];
  isLoading: boolean;
  onEdit: (question: Question, e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete: (question: Question, e: React.MouseEvent<HTMLButtonElement>) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  // Total matches across every page. When given, the table's own footer
  // (which could only count the rows on this page) is left to the pagination
  // control below it.
  totalCount?: number;
}

const getTypeBadgeColor = (type: string) =>
  type === "Objective" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";

const truncate = (text: string, len: number) =>
  text.length > len ? `${text.slice(0, len)}…` : text;

const subjectLabel = (subject: Question["subject"]): string =>
  typeof subject === "string" ? subject : (subject as Subject)?.name || "—";

const passageId = (question: Question): string | null => {
  if (!question.passageId) return null;
  return typeof question.passageId === "string" ? question.passageId : question.passageId._id;
};

const passageLabel = (question: Question): string | null => {
  if (!question.passageId) return null;
  const title =
    typeof question.passageId === "string" ? null : question.passageId.title || "Untitled passage";
  return title ?? "Untitled passage";
};

// Six columns (down from nine) so the table fits without sideways scrolling:
// subject and class share a cell, and a question's passage is shown under its
// text instead of getting a column of mostly empty dashes.
const columnHeaders = ["Question", "Type", "Subject and class", "Marks", "Group", "Actions"];

const TableShell: React.FC<{ children: React.ReactNode; selectAllCell?: React.ReactNode }> = ({
  children,
  selectAllCell,
}) => (
  <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full">
        <caption className="sr-only">Questions list</caption>
        <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
          <tr>
            <th scope="col" className="px-4 py-3 w-10">
              {selectAllCell}
            </th>
            {columnHeaders.map((header) => (
              <th
                key={header}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-semibold text-[#5A7A9A] uppercase tracking-wider whitespace-nowrap ${
                  header === "Question" ? "w-full min-w-[16rem]" : ""
                }`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  </div>
);

const QuestionBankTable: React.FC<QuestionBankTableProps> = ({
  questions,
  isLoading,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  totalCount,
}) => {
  // Rows sharing a passage sit next to each other, in passageOrder, rather
  // than scattered wherever the API's createdAt sort happened to put them
  // - both for a sighted admin scanning the table, and because a screen
  // reader user moving row-by-row hears a passage's questions as a
  // coherent group instead of interleaved with unrelated ones. Standalone
  // questions keep their original relative order.
  const sortedQuestions = useMemo(() => {
    const withIndex = questions.map((q, i) => ({ q, i }));
    const buckets = new Map<string, typeof withIndex>();
    const ordered: typeof withIndex = [];

    for (const item of withIndex) {
      const pid = passageId(item.q);
      if (!pid) {
        ordered.push(item);
        continue;
      }
      if (!buckets.has(pid)) {
        buckets.set(pid, []);
        ordered.push({ q: item.q, i: item.i }); // marks the group's insertion point
      }
      buckets.get(pid)!.push(item);
    }

    const inserted = new Set<string>();
    const final: typeof withIndex = [];
    for (const item of ordered) {
      const pid = passageId(item.q);
      if (!pid) {
        final.push(item);
        continue;
      }
      if (inserted.has(pid)) continue;
      inserted.add(pid);
      const group = buckets.get(pid)!;
      group.sort((a, b) => (a.q.passageOrder ?? 0) - (b.q.passageOrder ?? 0));
      final.push(...group);
    }
    return final.map(({ q }) => q);
  }, [questions]);

  if (isLoading) {
    return (
      <TableShell>
        <tbody>
          <tr>
            <td colSpan={columnHeaders.length + 1} className="px-4 py-12 text-center text-[#8A9CAE]">
              <p role="status" aria-live="polite">
                Loading questions…
              </p>
            </td>
          </tr>
        </tbody>
      </TableShell>
    );
  }

  if (questions.length === 0) {
    return (
      <TableShell>
        <tbody>
          <tr>
            <td colSpan={columnHeaders.length + 1} className="px-4 py-12 text-center text-[#8A9CAE]">
              <div className="text-4xl mb-2" aria-hidden="true">
                📝
              </div>
              <p className="font-medium">No questions found</p>
              <p className="text-sm">Add your first question to the bank</p>
            </td>
          </tr>
        </tbody>
      </TableShell>
    );
  }

  return (
    <TableShell
      selectAllCell={
        <input
          type="checkbox"
          checked={questions.length > 0 && selectedIds.size === questions.length}
          ref={(el) => {
            if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < questions.length;
          }}
          onChange={onToggleSelectAll}
          aria-label="Select all questions"
          className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
        />
      }>
      <tbody className="divide-y divide-[#E8EEF5]">
        {sortedQuestions.map((question, index) => {
          const label = passageLabel(question);
          return (
            <tr key={question._id} className="hover:bg-[#F8FAFE] transition align-top">
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(question._id)}
                  onChange={() => onToggleSelect(question._id)}
                  aria-label={`Select question: ${truncate(question.text, 40)}`}
                  className="w-4 h-4 mt-1 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
                />
              </td>
              <td className="px-4 py-4">
                {/* Two lines of the question instead of one cut-off line */}
                <p className="text-sm text-[#1A3A5C] line-clamp-2 break-words" title={question.text}>
                  {question.text}
                </p>
                {label && (
                  <p
                    className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-800"
                    title={`Part of the "${label}" passage, question ${question.passageOrder ?? "?"}`}>
                    <span aria-hidden="true">🔗</span>
                    <span>
                      Passage: {truncate(label, 40)}
                      {question.passageOrder ? ` · Q${question.passageOrder}` : ""}
                    </span>
                  </p>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTypeBadgeColor(question.type)}`}>
                  {question.type}
                </span>
              </td>
              <td className="px-4 py-4 text-sm whitespace-nowrap">
                <p className="text-[#1A3A5C] font-medium">{subjectLabel(question.subject)}</p>
                <p className="text-[#5A7A9A]">{question.class}</p>
              </td>
              <td className="px-4 py-4 text-sm text-[#1A3A5C] whitespace-nowrap">{question.marks}</td>
              <td className="px-4 py-4 text-sm text-[#4A6A8A]">
                {question.group ? (
                  <span className="block max-w-[11rem] break-words" title={question.group}>
                    {question.group}
                  </span>
                ) : (
                  <span className="text-[#8A9CAE]">Ungrouped</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => onEdit(question, e)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2B6CB0] bg-[#E8F0FE] hover:bg-[#D5E4F7] px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                    aria-label={`Edit question ${index + 1}: ${truncate(question.text, 40)}${
                      label ? `, part of passage ${label}` : ""
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => onDelete(question, e)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Delete question ${index + 1}: ${truncate(question.text, 40)}${
                      label ? `, part of passage ${label}` : ""
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
      {totalCount === undefined && (
        <tfoot>
          <tr>
            <td colSpan={columnHeaders.length + 1} className="px-4 py-3 border-t border-[#E8EEF5]">
              <p className="text-sm text-[#5A7A9A]">Total: {questions.length} questions</p>
            </td>
          </tr>
        </tfoot>
      )}
    </TableShell>
  );
};

export default QuestionBankTable;
