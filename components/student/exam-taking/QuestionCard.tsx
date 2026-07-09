import React from "react";
import { Question } from "@/types/exam-taking";
import ObjectiveQuestion from "./ObjectiveQuestion";
import TheoryQuestion from "./TheoryQuestion";

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answer: string;
  onAnswerChange: (questionId: number, value: string) => void;
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
      className="border border-[#C5D8EC] rounded-lg p-4 bg-[#F8FAFE] focus-within:ring-2 focus-within:ring-[#2B6CB0] focus-within:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
      role="group"
      aria-labelledby={`question-label-${question.id}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 id={`question-label-${question.id}`} className="text-base font-medium text-[#1A3A5C]">
          Question {questionIndex + 1} of {totalQuestions}
          {question.type === "theory" && " (Theory)"}
          {isAnswered && <span className="sr-only"> — answered</span>}
        </h3>
      </div>
      <p className="text-[#4A6A8A] mb-3 whitespace-pre-wrap">{question.text}</p>

      {question.type === "objective" && question.options && (
        <ObjectiveQuestion
          question={question}
          questionIndex={questionIndex}
          selectedAnswer={answer}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "theory" && (
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
