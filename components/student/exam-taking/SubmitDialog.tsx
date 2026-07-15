"use client";

import React, { useEffect, useRef } from "react";
import { ExamSessionMeta } from "@/types/exam-session";
import { getExamTypeLabel } from "@/config/exam-type-utils";

interface SubmitDialogProps {
  isOpen: boolean;
  exam: ExamSessionMeta;
  answeredCount: number;
  totalQuestions: number;
  timeRemaining: number;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const SubmitDialog: React.FC<SubmitDialogProps> = ({
  isOpen,
  exam,
  answeredCount,
  totalQuestions,
  timeRemaining,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleTrap);
    return () => document.removeEventListener("keydown", handleTrap);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, onCancel]);

  useEffect(() => {
    if (isOpen) document.getElementById("confirm-submit")?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const unanswered = totalQuestions - answeredCount;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#B8D0E8]">
        <div className="bg-[#1A3A5C] -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
          <h2 id="dialog-title" className="text-xl font-bold text-white">
            Submit Examination?
          </h2>
        </div>

        <div className="mt-6">
          <p className="text-[#4A6A8A] mb-4">
            You are about to submit your {getExamTypeLabel(exam.type)} examination.
          </p>
          <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-4">
            <p className="text-sm text-[#4A6A8A]">
              <span className="font-medium">Answered:</span> {answeredCount} of {totalQuestions}
            </p>
            <p className="text-sm text-[#4A6A8A]">
              <span className="font-medium">Time remaining:</span> {formatTime(timeRemaining)}
            </p>
          </div>
          {unanswered > 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              {unanswered} question{unanswered === 1 ? " is" : "s are"} still unanswered.
            </p>
          )}
          <p className="text-sm text-yellow-700 mb-4">This action cannot be undone.</p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50">
              Cancel
            </button>
            <button
              id="confirm-submit"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md disabled:opacity-50">
              {isSubmitting ? "Submitting..." : "Yes, Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitDialog;
