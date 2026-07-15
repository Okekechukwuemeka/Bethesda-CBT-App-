import React from "react";
import { SessionQuestion } from "@/types/exam-session";
import QuestionCard from "./QuestionCard";

interface QuestionsListProps {
  questions: SessionQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, value: string, isObjective: boolean) => void;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ questions, answers, onAnswerChange }) => (
  <div className="space-y-5">
    <h2 className="text-xl font-semibold text-[#1A3A5C] border-b border-[#E8EEF5] pb-3">
      Questions
    </h2>
    {questions.map((question, index) => (
      <QuestionCard
        key={question._id}
        question={question}
        questionIndex={index}
        totalQuestions={questions.length}
        answer={answers[question._id]}
        onAnswerChange={onAnswerChange}
      />
    ))}
  </div>
);

export default QuestionsList;
