import React from "react";
import { SessionQuestion } from "@/types/exam-session";

interface TheoryQuestionProps {
  question: SessionQuestion;
  questionIndex: number;
  answer: string | undefined;
  onAnswerChange: (questionId: string, value: string, isObjective: boolean) => void;
}

const TheoryQuestion: React.FC<TheoryQuestionProps> = ({
  question,
  questionIndex,
  answer,
  onAnswerChange,
}) => {
  return (
    <div>
      <label htmlFor={`answer-${question._id}`} className="sr-only">
        Your answer for question {questionIndex + 1}
      </label>
      <textarea
        id={`answer-${question._id}`}
        value={answer || ""}
        onChange={(e) => onAnswerChange(question._id, e.target.value, false)}
        rows={6}
        className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-white text-[#1A1A1A] resize-y"
        placeholder="Write your answer here..."
        aria-describedby={`question-label-${question._id} char-count-${question._id}`}
      />
      <p id={`char-count-${question._id}`} className="text-xs text-[#8A9CAE] mt-1">
        {answer?.length || 0} characters typed
      </p>
    </div>
  );
};

export default TheoryQuestion;
