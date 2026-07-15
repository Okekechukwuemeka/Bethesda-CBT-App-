import React from "react";
import { SessionQuestion } from "@/types/exam-session";
import ObjectiveQuestion from "./ObjectiveQuestion";
import TheoryQuestion from "./TheoryQuestion";

interface QuestionCardProps {
  question: SessionQuestion;
  questionIndex: number;
  totalQuestions: number;
  answer: string | undefined;
  onAnswerChange: (questionId: string, value: string, isObjective: boolean) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  answer,
  onAnswerChange,
}) => {
  const isAnswered = Boolean(answer);

  return (
    <div
      id={`question-${questionIndex}`}
      tabIndex={-1}
      className="border border-[#C5D8EC] rounded-lg p-4 bg-[#F8FAFE] focus-within:ring-2 focus-within:ring-[#2B6CB0] focus:outline-none"
      role="group"
      aria-labelledby={`question-label-${question._id}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 id={`question-label-${question._id}`} className="text-base font-medium text-[#1A3A5C]">
          Question {questionIndex + 1} of {totalQuestions}
          {question.type === "Theory" && " (Theory)"}
          {isAnswered && <span className="sr-only"> — answered</span>}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-[#E8EEF5] text-[#1A3A5C] font-medium">
          {question.marks} mark{question.marks === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-[#4A6A8A] mb-3 whitespace-pre-wrap">{question.text}</p>

      {question.type === "Objective" && question.options && (
        <ObjectiveQuestion
          question={question}
          selectedAnswer={answer}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "Theory" && (
        <TheoryQuestion
          question={question}
          questionIndex={questionIndex}
          answer={answer}
          onAnswerChange={onAnswerChange}
        />
      )}
    </div>
  );
};

export default QuestionCard;
