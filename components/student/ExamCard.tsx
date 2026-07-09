import React from "react";
import { Exam } from "@/types/student-exam";
import { getExamTypeLabel, getExamTypeColor } from "@/config/exam-type-utils";

interface ExamCardProps {
  exam: Exam;
  onStartExam: (exam: Exam, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onStartExam }) => {
  return (
    <li className="border border-[#C5D8EC] rounded-lg p-4 hover:border-[#2B6CB0] transition-all duration-200 bg-[#F8FAFE]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#1A3A5C]">{exam.subject}</h2>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${getExamTypeColor(exam.type)}`}>
              {getExamTypeLabel(exam.type)}
            </span>
          </div>
          <p className="text-sm text-[#4A6A8A] font-medium">{exam.term}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-[#5A7A9A]">
            <span>
              <span className="font-medium">Date:</span> {exam.date}
            </span>
            <span>
              <span className="font-medium">Time:</span> {exam.time}
            </span>
            <span>
              <span className="font-medium">Duration:</span> {exam.duration}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => onStartExam(exam, e)}
          className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] whitespace-nowrap"
          aria-label={`Start ${exam.subject} ${getExamTypeLabel(exam.type)} examination, ${exam.date} at ${exam.time}, duration ${exam.duration}`}>
          Start Exam
        </button>
      </div>
    </li>
  );
};

export default ExamCard;
