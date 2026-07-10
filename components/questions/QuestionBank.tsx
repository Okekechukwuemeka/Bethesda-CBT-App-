import React from "react";
import Link from "next/link";
import { Question } from "@/types/question";
import QuestionBankFilters from "./QuestionBankFilters";
import QuestionBankItem from "./QuestionBankItem";

interface QuestionBankProps {
  isOpen: boolean;
  onToggle: () => void;
  questions: Question[];
  selectedQuestions: Question[];
  searchTerm: string;
  filterType: string;
  filterSubject: string;
  filterClass: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onAddQuestion: (question: Question) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({
  isOpen,
  onToggle,
  questions,
  selectedQuestions,
  searchTerm,
  filterType,
  filterSubject,
  filterClass,
  onSearchChange,
  onTypeChange,
  onSubjectChange,
  onClassChange,
  onAddQuestion,
}) => {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="text-[#2B6CB0] hover:text-[#1A3A5C] text-sm font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-2 py-1"
        aria-expanded={isOpen}>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {isOpen ? "Hide Question Bank" : "Browse Question Bank"}
      </button>

      {isOpen && (
        <div className="mt-4 border border-[#C5D8EC] rounded-lg p-4">
          <QuestionBankFilters
            searchTerm={searchTerm}
            filterType={filterType}
            filterSubject={filterSubject}
            filterClass={filterClass}
            onSearchChange={onSearchChange}
            onTypeChange={onTypeChange}
            onSubjectChange={onSubjectChange}
            onClassChange={onClassChange}
          />

          <div className="max-h-60 overflow-y-auto space-y-2">
            {questions.length === 0 ? (
              <p className="text-sm text-[#8A9CAE] text-center py-4">
                No questions found in the question bank.
                <br />
                <Link href="/admin/questions" className="text-[#2B6CB0] hover:underline">
                  Create questions first
                </Link>
              </p>
            ) : (
              questions.map((q) => {
                const isSelected = selectedQuestions.some((sq) => sq.id === q.id);
                return (
                  <QuestionBankItem
                    key={q.id}
                    question={q}
                    isSelected={isSelected}
                    onAdd={onAddQuestion}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
