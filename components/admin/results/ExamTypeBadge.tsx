import React from "react";

interface ExamTypeBadgeProps {
  type: string;
}

const getExamTypeColor = (type: string) => {
  switch (type) {
    case "objective":
      return "bg-blue-100 text-blue-800";
    case "theory":
      return "bg-purple-100 text-purple-800";
    case "mixed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ExamTypeBadge: React.FC<ExamTypeBadgeProps> = ({ type }) => {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getExamTypeColor(type)}`}>
      {type}
    </span>
  );
};

export default ExamTypeBadge;
