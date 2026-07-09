import React from "react";
import { Exam } from "@/types/student-exam";
import { getExamTypeLabel } from "@/config/exam-type-utils";

interface ExamDetailsProps {
  exam: Exam;
}

const ExamDetails: React.FC<ExamDetailsProps> = ({ exam }) => {
  return (
    <div
      className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6"
      aria-label={`Exam details: ${exam.subject}, ${getExamTypeLabel(exam.type)}, ${exam.date} at ${exam.time}, duration ${exam.duration}`}>
      <p className="text-sm text-[#4A6A8A]">
        <span className="font-medium text-[#1A3A5C]">Subject:</span> {exam.subject}
      </p>
      <p className="text-sm text-[#4A6A8A]">
        <span className="font-medium text-[#1A3A5C]">Type:</span> {getExamTypeLabel(exam.type)}
      </p>
      <p className="text-sm text-[#4A6A8A]">
        <span className="font-medium text-[#1A3A5C]">Date:</span> {exam.date} at {exam.time}
      </p>
      <p className="text-sm text-[#4A6A8A]">
        <span className="font-medium text-[#1A3A5C]">Duration:</span> {exam.duration}
      </p>
    </div>
  );
};

export default ExamDetails;
