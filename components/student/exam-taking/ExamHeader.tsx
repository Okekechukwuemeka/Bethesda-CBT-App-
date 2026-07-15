import React from "react";
import { ExamSessionMeta } from "@/types/exam-session";
import { getExamTypeLabel } from "@/config/exam-type-utils";

const ExamHeader: React.FC<{ exam: ExamSessionMeta }> = ({ exam }) => {
  return (
    <header className="bg-[#1A3A5C] rounded-t-2xl px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">{exam.title}</h1>
          <p className="text-[#8BB8E8] text-sm">{getExamTypeLabel(exam.type)} Examination</p>
        </div>
        <div className="text-right">
          <p className="text-white/70 text-sm">Time Allowed: {exam.duration} min</p>
          <p className="text-white/70 text-sm">Total Marks: {exam.totalMarks}</p>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
