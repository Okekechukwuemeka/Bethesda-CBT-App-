import React, { useEffect, useRef } from "react";
import { ExamData } from "@/types/exam-taking";
import { getExamTypeLabel } from "@/config/exam-type-utils";

interface ExamSubmittedProps {
  exam: ExamData;
  answeredCount: number;
  totalQuestions: number;
  isTimeUp: boolean;
}

const ExamSubmitted: React.FC<ExamSubmittedProps> = ({
  exam,
  answeredCount,
  totalQuestions,
  isTimeUp,
}) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-[#B8D0E8] text-center">
        <div
          className={`p-4 rounded-lg mb-6 border ${
            isTimeUp
              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
              : "bg-green-100 text-green-800 border-green-300"
          }`}>
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold mb-2 focus:outline-none">
            Exam Submitted
          </h1>
          <p>Your answers have been recorded successfully.</p>
        </div>

        <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6">
          <ExamDetail label="Subject" value={exam.subject} />
          <ExamDetail label="Type" value={getExamTypeLabel(exam.type)} />
          <ExamDetail label="Questions Answered" value={`${answeredCount} of ${totalQuestions}`} />
          {isTimeUp && (
            <p className="text-yellow-700 mt-2 text-sm">
              Time is up. Your exam has been automatically submitted.
            </p>
          )}
        </div>

        <a
          href="/student/exams"
          className="inline-block bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
          Return to Exams
        </a>
      </div>
    </div>
  );
};

const ExamDetail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <p className="text-[#4A6A8A]">
    <span className="font-medium">{label}:</span> {value}
  </p>
);

export default ExamSubmitted;
