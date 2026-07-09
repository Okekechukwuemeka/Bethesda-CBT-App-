import React from "react";
import { Question } from "@/types/exam-taking";
import QuestionCard from "./QuestionCard";

interface QuestionsListProps {
  questions: Question[];
  answers: Record<number, string>;
  onAnswerChange: (questionId: number, value: string) => void;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ questions, answers, onAnswerChange }) => {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-[#1A3A5C] border-b border-[#E8EEF5] pb-3">
        Questions
      </h2>
      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          questionIndex={index}
          totalQuestions={questions.length}
          answer={answers[question.id]}
          onAnswerChange={onAnswerChange}
        />
      ))}
    </div>
  );
};

export default QuestionsList;
