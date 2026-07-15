import React from "react";
import { Exam } from "@/types/student-exam";
import { getExamTypeLabel, getExamTypeColor } from "@/config/exam-type-utils";
import { formatExamDate, formatExamTime, formatExamDuration } from "@/lib/exam-format";

interface ExamCardProps {
  exam: Exam;
  onStartExam: (exam: Exam, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onStartExam }) => {
  const date = formatExamDate(exam.examDate);
  const time = formatExamTime(exam.examDate);
  const duration = formatExamDuration(exam.duration);

  return (
    <li className="border border-[#C5D8EC] rounded-lg p-4 hover:border-[#2B6CB0] transition-all duration-200 bg-[#F8FAFE]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-[#1A3A5C]">{exam.subject}</h2>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${getExamTypeColor(exam.type)}`}>
              {getExamTypeLabel(exam.type)}
            </span>
            {exam.status === "Ongoing" && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-800">
                Ongoing
              </span>
            )}
            {!exam.isAvailable && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                Not Yet Open
              </span>
            )}
          </div>
          <p className="text-sm text-[#4A6A8A] font-medium">
            {exam.title} · {exam.term}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-[#5A7A9A]">
            <span>
              <span className="font-medium">Date:</span> {date}
            </span>
            <span>
              <span className="font-medium">Time:</span> {time}
            </span>
            <span>
              <span className="font-medium">Duration:</span> {duration}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => onStartExam(exam, e)}
          disabled={!exam.isAvailable}
          className="bg-[#1A3A5C] hover:bg-[#14304D] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1A3A5C] text-white font-medium px-6 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] whitespace-nowrap"
          aria-label={
            exam.isAvailable
              ? `Start ${exam.subject} ${getExamTypeLabel(exam.type)} examination, ${date} at ${time}, duration ${duration}`
              : `${exam.subject} opens on ${date} at ${time}`
          }>
          {exam.isAvailable ? "Start Exam" : "Not Yet Open"}
        </button>
      </div>
    </li>
  );
};

export default ExamCard;
