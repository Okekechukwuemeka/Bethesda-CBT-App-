import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface SuccessStateWithQuestionsProps {
  examTitle: string;
  examId?: string | null;
  questionCount: number;
  examCode?: string | null;
  onReset: () => void;
}

const SuccessStateWithQuestions: React.FC<SuccessStateWithQuestionsProps> = ({
  examTitle,
  examId,
  questionCount,
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
        &ldquo;{examTitle}&rdquo; has been created
        {questionCount > 0 ? ` with ${questionCount} question(s) imported.` : "."}
      </p>

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
            Share this with the students eligible to take this exam. You can find it again on the
            exam&apos;s edit page later.
          </p>
        </div>
      )}

      {questionCount === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-sm mx-auto">
          No questions were added yet. Go to the exam&apos;s Questions page to add some before
          students can take it.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={onReset}
          className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
          Create Another Exam
        </button>
        {examId && (
          <button
            type="button"
            onClick={() => router.push(`/admin/exams/${examId}/questions`)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50">
            Manage Questions
          </button>
        )}
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
