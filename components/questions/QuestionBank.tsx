import React from "react";
import Link from "next/link";
import { BankQuestion } from "@/types/exam.types";
import QuestionBankFilters from "./QuestionBankFilters";
import QuestionBankItem from "./QuestionBankItem";
interface QuestionBankProps {
  isOpen: boolean;
  onToggle: () => void;
  isLoadingBank: boolean;
  questions: BankQuestion[];
  selectedQuestions: BankQuestion[];
  subjects: { id: string; name: string }[];
  searchTerm: string;
  filterType: string;
  filterSubject: string;
  filterClass: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onAddQuestion: (question: BankQuestion) => void;
  checkedIds?: Set<string>;
  onToggleCheck?: (id: string) => void;
  onAttachSelected?: () => void;
  isAttachingSelected?: boolean;
}

const QuestionBank: React.FC<QuestionBankProps> = ({
  isOpen,
  onToggle,
  questions,
  selectedQuestions,
  subjects,
  searchTerm,
  filterType,
  filterSubject,
  filterClass,
  onSearchChange,
  onTypeChange,
  onSubjectChange,
  onClassChange,
  onAddQuestion,
  checkedIds,
  onToggleCheck,
  onAttachSelected,
  isAttachingSelected,
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
            subjects={subjects}
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
                    isChecked={checkedIds?.has(q.id)}
                    onToggleCheck={onToggleCheck}
                  />
                );
              })
            )}
          </div>

          {onAttachSelected && checkedIds && checkedIds.size > 0 && (
            <div className="mt-3 bg-[#1A3A5C] text-white rounded-lg px-3 py-2 flex items-center justify-between">
              <p className="text-sm font-medium">
                {checkedIds.size} question{checkedIds.size !== 1 ? "s" : ""} selected
              </p>
              <button
                type="button"
                onClick={onAttachSelected}
                disabled={isAttachingSelected}
                className="bg-white text-[#1A3A5C] text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-[#E8F0FE] transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white">
                {isAttachingSelected ? "Attaching…" : "Attach Selected"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
