import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface SuccessStateWithQuestionsProps {
  examTitle: string;
  questionCount: number;
  totalMarks: number;
  examCode?: string | null;
  onReset: () => void;
}

const SuccessStateWithQuestions: React.FC<SuccessStateWithQuestionsProps> = ({
  examTitle,
  questionCount,
  totalMarks,
  examCode,
  onReset,
}) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!examCode) return;
    try {
      await navigator.clipboard.writeText(examCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="text-center py-8 space-y-4" role="status" aria-live="polite">
      <p className="text-[#1A3A5C]">
        &ldquo;{examTitle}&rdquo; has been created with <strong>{questionCount}</strong> questions.
      </p>
      <p className="text-sm text-[#5A7A9A]">Total Marks: {totalMarks}</p>

      {examCode && (
        <div className="max-w-sm mx-auto bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4">
          <p className="text-sm font-medium text-[#5A7A9A]">Exam Code</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-2xl font-mono font-bold text-[#1A3A5C] select-all tracking-wider">
              {examCode}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="text-sm px-3 py-1.5 rounded-lg border border-[#2B6CB0] text-[#2B6CB0] hover:bg-[#E8F0FE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
              aria-label={`Copy exam code ${examCode}`}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-[#8A9CAE] mt-2">
            Share this with students in the class this exam is set for. You can find it again on the
            exam&apos;s edit page later.
          </p>
        </div>
      )}

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
