import React, { useEffect, useRef } from "react";
import type { BlockingExam } from "@/types/question";

interface BlockedQuestion {
  questionId: string;
  exams: BlockingExam[];
}

interface BulkDeleteQuestionsModalProps {
  isOpen: boolean;
  selectedCount: number;
  isProcessing: boolean;
  error: string | null;
  blocked: BlockedQuestion[] | null;
  onConfirm: () => void;
  onForceConfirm: () => void;
  onCancel: () => void;
}

const BulkDeleteQuestionsModal: React.FC<BulkDeleteQuestionsModalProps> = ({
  isOpen,
  selectedCount,
  isProcessing,
  error,
  blocked,
  onConfirm,
  onForceConfirm,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) primaryButtonRef.current?.focus();
  }, [isOpen, blocked]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) onCancel();
    };
    const handleTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTrap);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTrap);
    };
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-title"
      aria-describedby="bulk-delete-description"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onCancel();
      }}>
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#B8D0E8]">
        <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl">
          <h2 id="bulk-delete-title" className="text-xl font-bold text-white">
            {blocked ? "Some questions are used in exams" : `Delete ${selectedCount} question${selectedCount !== 1 ? "s" : ""}?`}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
              {error}
            </div>
          )}

          {!blocked ? (
            <div id="bulk-delete-description" className="text-sm text-[#4A6A8A]">
              <p>
                You are about to permanently delete {selectedCount} question
                {selectedCount !== 1 ? "s" : ""} from the bank. This cannot be undone.
              </p>
            </div>
          ) : (
            <div id="bulk-delete-description" className="text-sm text-[#4A6A8A] space-y-2">
              <p>
                {blocked.length} of the selected questions are currently attached to one or more
                exams:
              </p>
              <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                {blocked.map((b) => (
                  <li key={b.questionId}>
                    {b.exams.map((e) => e.title).join(", ")}
                  </li>
                ))}
              </ul>
              <p>
                Continuing will detach every selected question from the exams listed above, then
                delete all {selectedCount} selected question{selectedCount !== 1 ? "s" : ""}. This
                cannot be undone.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
              Cancel
            </button>
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={blocked ? onForceConfirm : onConfirm}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 active:scale-[0.98] disabled:opacity-50">
              {isProcessing
                ? "Deleting…"
                : blocked
                  ? "Detach from exams & delete"
                  : `Delete ${selectedCount} question${selectedCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteQuestionsModal;
