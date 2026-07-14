import React from "react";

interface QuestionBadgeProps {
  type: "Objective" | "Theory"; // was lowercase — now matches BankQuestion.type
}

const QuestionBadge: React.FC<QuestionBadgeProps> = ({ type }) => {
  const colors = {
    Objective: "bg-blue-100 text-blue-800",
    Theory: "bg-purple-100 text-purple-800",
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${colors[type]}`}>
      {type}
    </span>
  );
};

export default QuestionBadge;
