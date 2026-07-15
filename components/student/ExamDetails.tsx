import React from "react";
import { Exam } from "@/types/student-exam";
import { getExamTypeLabel } from "@/config/exam-type-utils";
import { formatExamDate, formatExamTime, formatExamDuration } from "@/lib/exam-format";

interface ExamDetailsProps {
  exam: Exam;
}

const ExamDetails: React.FC<ExamDetailsProps> = ({ exam }) => {
  const date = formatExamDate(exam.examDate);
  const time = formatExamTime(exam.examDate);
  const duration = formatExamDuration(exam.duration);

  return (
    <div
      className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6"
      aria-label={`Exam details: ${exam.subject}, ${getExamTypeLabel(exam.type)}, ${date} at ${time}, duration ${duration}`}>
      <p className="text-sm text-[#4A6A8A]">
        <span className="font-medium text-[#1A3A5C]">Subject:</span> {exam.subject}
      </p>
      <p className="text-sm text-[#4A6A8A]">
        <span className="font-medium text-[#1A3A5C]">Type:</span> {getExamTypeLabel(exam.type)}
      </p>
      <p className="text-sm text-[#4A6A8A]">
        <span className="font-medium text-[#1A3A5C]">Date:</span> {date} at {time}
      </p>
      <p className="text-sm text-[#4A6A8A]">
        <span className="font-medium text-[#1A3A5C]">Duration:</span> {duration}
      </p>
    </div>
  );
};

export default ExamDetails;
