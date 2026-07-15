import React from "react";
import { ExamSessionMeta, SubmitResult } from "@/types/exam-session";

interface ExamSubmittedProps {
  exam: ExamSessionMeta;
  result: SubmitResult | null;
  onDone: () => void;
}

const ExamSubmitted: React.FC<ExamSubmittedProps> = ({ exam, result, onDone }) => {
  const isMarked = result?.status === "Marked";

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#B8D0E8] max-w-md w-full p-8 text-center">
        <div
          className={`mx-auto mb-4 h-14 w-14 rounded-full flex items-center justify-center text-2xl ${
            isMarked ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
          aria-hidden="true">
          ✓
        </div>
        <h1 className="text-xl font-bold text-[#1A3A5C] mb-1">Exam Submitted</h1>
        <p className="text-sm text-[#4A6A8A] mb-6">{exam.title}</p>

        {isMarked ? (
          <p className="text-3xl font-bold text-[#1A3A5C] mb-6">
            {result?.score}{" "}
            <span className="text-base font-medium text-[#4A6A8A]">/ {result?.totalMarks}</span>
          </p>
        ) : (
          <p className="text-sm text-[#4A6A8A] bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6">
            Your answers have been recorded. Theory questions are graded manually, so your final
            score will be available once marking is complete.
          </p>
        )}

        <button
          type="button"
          onClick={onDone}
          className="w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200">
          Back to Examinations
        </button>
      </div>
    </div>
  );
};

export default ExamSubmitted;
