import React from "react";
import { ExamData } from "@/types/exam-taking";
import { getExamTypeLabel } from "@/config/exam-type-utils";

interface ExamHeaderProps {
  exam: ExamData;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({ exam }) => {
  return (
    <header className="bg-[#1A3A5C] rounded-t-2xl px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">{exam.subject}</h1>
          <p className="text-[#8BB8E8] text-sm">
            {exam.class} • {exam.term} • {getExamTypeLabel(exam.type)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/70 text-sm">
            {exam.date} at {exam.time}
          </p>
          <p className="text-white/70 text-sm">Time Allowed: {exam.duration} min</p>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
