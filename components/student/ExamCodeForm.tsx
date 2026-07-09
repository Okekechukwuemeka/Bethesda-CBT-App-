import React, { useEffect, useRef } from "react";
import { Exam, StatusMessage } from "@/types/student-exam";
import ExamDetails from "./ExamDetails";
import StatusMessageComponent from "@/components/ui/StatusMessage";

interface ExamCodeFormProps {
  exam: Exam;
  examCode: string;
  onExamCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  statusMessage: StatusMessage | null;
  isCodeVerified: boolean;
}

const ExamCodeForm: React.FC<ExamCodeFormProps> = ({
  exam,
  examCode,
  onExamCodeChange,
  onSubmit,
  onCancel,
  statusMessage,
  isCodeVerified,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <ExamDetails exam={exam} />

      {statusMessage && (
        <StatusMessageComponent type={statusMessage.type} text={statusMessage.text} />
      )}

      <form onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="examCode" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Examination Code{" "}
            <span aria-hidden="true" className="text-red-500">
              *
            </span>
            <span className="sr-only"> required</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            id="examCode"
            value={examCode}
            onChange={(e) => onExamCodeChange(e.target.value)}
            required
            autoComplete="off"
            aria-required="true"
            aria-invalid={statusMessage?.type === "error"}
            aria-describedby={statusMessage ? "status-message" : undefined}
            placeholder="Enter the exam code provided"
            disabled={isCodeVerified}
            className="w-full px-4 py-3 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#8A9CAE] disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCodeVerified}
            className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50 disabled:cursor-not-allowed">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCodeVerified}
            className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            {isCodeVerified ? (
              <>
                <span aria-hidden="true">Verified ✓</span>
                <span className="sr-only">Code verified, starting exam</span>
              </>
            ) : (
              "Verify & Start"
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default ExamCodeForm;
