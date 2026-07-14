import React from "react";
import { BankQuestion } from "@/types/exam.types";

interface SelectedQuestionsListProps {
  questions: BankQuestion[];
  onRemove: (questionId: string) => void;
}

const SelectedQuestionsList: React.FC<SelectedQuestionsListProps> = ({ questions, onRemove }) => {
  if (questions.length === 0) {
    return (
      <p className="text-sm text-[#8A9CAE] py-2">
        No questions added yet. Browse the question bank below to add some.
      </p>
    );
  }

  return (
    <ul className="space-y-2 mb-4">
      {questions.map((q) => (
        <li
          key={q.id}
          className="flex items-center justify-between p-3 border border-[#C5D8EC] rounded-lg bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm text-[#1A3A5C] truncate">{q.text}</span>
            <span className="text-xs text-[#5A7A9A] flex-shrink-0">{q.marks} marks</span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(q.id)}
            className="text-sm px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 flex-shrink-0"
            aria-label={`Remove question: ${q.text.substring(0, 50)}`}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
};

export default SelectedQuestionsList;
