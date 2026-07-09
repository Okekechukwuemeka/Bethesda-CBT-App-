import React from "react";
import { Question } from "@/types/exam-taking";

interface TheoryQuestionProps {
  question: Question;
  questionIndex: number;
  answer: string;
  onAnswerChange: (questionId: number, value: string) => void;
}

const TheoryQuestion: React.FC<TheoryQuestionProps> = ({
  question,
  questionIndex,
  answer,
  onAnswerChange,
}) => {
  return (
    <div>
      <label htmlFor={`answer-${question.id}`} className="sr-only">
        Your answer for question {questionIndex + 1}
      </label>
      <textarea
        id={`answer-${question.id}`}
        value={answer || ""}
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
        rows={6}
        className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-white text-[#1A1A1A] resize-y"
        placeholder="Write your answer here..."
        aria-describedby={`question-label-${question.id} char-count-${question.id}`}
      />
      <p id={`char-count-${question.id}`} className="text-xs text-[#8A9CAE] mt-1">
        {answer?.length || 0} characters typed
      </p>
    </div>
  );
};

export default TheoryQuestion;
