import React from "react";
import { BankQuestion } from "@/types/exam.types"; // was: Question from "@/types/question"
import QuestionBadge from "./QuestionBadge";

interface QuestionBankItemProps {
  question: BankQuestion;
  isSelected: boolean;
  onAdd: (question: BankQuestion) => void;
}

const QuestionBankItem: React.FC<QuestionBankItemProps> = ({ question, isSelected, onAdd }) => {
  const subjectName =
    typeof question.subject === "string" ? question.subject : question.subject.name;

  const passageLabel = question.passage?.title || (question.passage ? "Untitled passage" : null);

  return (
    <div
      className={`flex items-center justify-between p-3 border rounded-lg ${
        isSelected
          ? "bg-green-50 border-green-300"
          : "bg-white border-[#C5D8EC] hover:border-[#2B6CB0]"
      } transition`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-sm text-[#1A3A5C] truncate">{question.text}</span>
        <QuestionBadge type={question.type} />
        {passageLabel && (
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 flex-shrink-0"
            title={`Part of the "${passageLabel}" passage, question ${question.passageOrder ?? "?"}`}>
            <span aria-hidden="true">🔗</span>
            <span className="max-w-[8rem] truncate">
              {passageLabel}
              {question.passageOrder ? ` · Q${question.passageOrder}` : ""}
            </span>
          </span>
        )}
        <span className="text-xs text-[#5A7A9A] flex-shrink-0">{question.marks} marks</span>
        <span className="text-xs text-[#5A7A9A] flex-shrink-0">{subjectName}</span>
        <span className="text-xs text-[#5A7A9A] flex-shrink-0">{question.class}</span>
      </div>
      <button
        type="button"
        onClick={() => onAdd(question)}
        disabled={isSelected}
        className={`px-3 py-1 text-sm rounded-lg transition focus:outline-none focus:ring-2 flex-shrink-0 ${
          isSelected
            ? "bg-green-100 text-green-700 cursor-default"
            : "bg-[#1A3A5C] hover:bg-[#14304D] text-white focus:ring-[#2B6CB0]"
        }`}
        aria-label={
          isSelected
            ? "Already added"
            : `Add question: ${question.text.substring(0, 50)}${
                passageLabel ? `, part of passage ${passageLabel}` : ""
              }`
        }>
        {isSelected ? "Added ✓" : "Add"}
      </button>
    </div>
  );
};

export default QuestionBankItem;
