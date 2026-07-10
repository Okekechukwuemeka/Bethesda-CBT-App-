import React from "react";
import { useRouter } from "next/navigation";

interface SuccessStateWithQuestionsProps {
  examTitle: string;
  questionCount: number;
  totalMarks: number;
  onReset: () => void;
}

const SuccessStateWithQuestions: React.FC<SuccessStateWithQuestionsProps> = ({
  examTitle,
  questionCount,
  totalMarks,
  onReset,
}) => {
  const router = useRouter();

  return (
    <div className="text-center py-8 space-y-4">
      <p className="text-[#1A3A5C]">
        &ldquo;{examTitle}&rdquo; has been created with <strong>{questionCount}</strong> questions.
      </p>
      <p className="text-sm text-[#5A7A9A]">Total Marks: {totalMarks}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={onReset}
          className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
          Create Another Exam
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/exams")}
          className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
          View All Exams
        </button>
      </div>
    </div>
  );
};

export default SuccessStateWithQuestions;
