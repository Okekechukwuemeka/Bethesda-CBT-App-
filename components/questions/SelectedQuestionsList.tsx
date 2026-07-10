import React from "react";
import { Question } from "@/types/question";
import QuestionBadge from "./QuestionBadge";

interface SelectedQuestionsListProps {
  questions: Question[];
  onRemove: (questionId: number) => void;
}

const SelectedQuestionsList: React.FC<SelectedQuestionsListProps> = ({ questions, onRemove }) => {
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  if (questions.length === 0) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-[#1A3A5C]">Selected Questions</h3>
          <span className="text-sm text-[#5A7A9A]">Total Marks: 0</span>
        </div>
        <p className="text-sm text-[#8A9CAE] py-4 text-center border-2 border-dashed border-[#C5D8EC] rounded-lg">
          No questions added yet. Search and add questions from the question bank below.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-[#1A3A5C]">
          Selected Questions ({questions.length})
        </h3>
        <span className="text-sm text-[#5A7A9A]">Total Marks: {totalMarks}</span>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="flex items-center justify-between p-3 bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xs font-medium text-[#5A7A9A] w-6">{index + 1}.</span>
              <span className="text-sm text-[#1A3A5C] truncate">{q.text}</span>
              <QuestionBadge type={q.type} />
              <span className="text-xs text-[#5A7A9A] flex-shrink-0">{q.marks} marks</span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(q.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500 flex-shrink-0"
              aria-label={`Remove question ${index + 1}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedQuestionsList;
