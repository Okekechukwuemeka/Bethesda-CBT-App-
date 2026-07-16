import React from "react";
import type { ExamTypeLower } from "@/types/admin-results";

// Referenced by SubjectResultsTable in both pasted versions but never
// actually included - built to match the color conventions already used
// elsewhere (QuestionBankTable's type badges, PerformanceBadge's palette).
interface ExamTypeBadgeProps {
  type: ExamTypeLower;
}

const colors: Record<ExamTypeLower, string> = {
  objective: "bg-blue-100 text-blue-800",
  theory: "bg-purple-100 text-purple-800",
  mixed: "bg-indigo-100 text-indigo-800",
};

const ExamTypeBadge: React.FC<ExamTypeBadgeProps> = ({ type }) => (
  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${colors[type]}`}>
    {type}
  </span>
);

export default ExamTypeBadge;
