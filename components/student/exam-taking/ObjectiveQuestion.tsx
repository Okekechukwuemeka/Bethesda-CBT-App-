import React from "react";
import { SessionQuestion } from "@/types/exam-session";

interface ObjectiveQuestionProps {
  question: SessionQuestion;
  selectedAnswer: string | undefined;
  onAnswerChange: (questionId: string, value: string, isObjective: boolean) => void;
}

const ObjectiveQuestion: React.FC<ObjectiveQuestionProps> = ({
  question,
  selectedAnswer,
  onAnswerChange,
}) => {
  return (
    <div
      className="space-y-2"
      role="radiogroup"
      aria-labelledby={`question-label-${question._id}`}
      aria-required="true">
      {question.options?.map((option, optIndex) => {
        const letter = String.fromCharCode(65 + optIndex);
        const isSelected = selectedAnswer === option;

        return (
          <label
            key={optIndex}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
              isSelected ? "bg-[#D4E4F7] ring-2 ring-[#2B6CB0]" : "hover:bg-[#E8EEF5]"
            }`}>
            <input
              type="radio"
              name={`question-${question._id}`}
              value={option}
              checked={isSelected}
              onChange={(e) => onAnswerChange(question._id, e.target.value, true)}
              className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0]"
              aria-label={`Option ${letter}: ${option}`}
            />
            <span className="text-[#4A6A8A] font-medium" aria-hidden="true">
              {letter}.
            </span>
            <span className="text-[#4A6A8A]" aria-hidden="true">
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default ObjectiveQuestion;
