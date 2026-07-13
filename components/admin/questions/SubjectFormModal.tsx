import React, { useEffect, useRef } from "react";

interface SubjectFormModalProps {
  isOpen: boolean;
  name: string;
  code: string;
  formError: string | null;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  name,
  code,
  formError,
  isSubmitting,
  onNameChange,
  onCodeChange,
  onSubmit,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) firstInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onCancel();
    };
    const handleTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
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
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}>
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#B8D0E8]">
        <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl">
          <h2 id="subject-modal-title" className="text-xl font-bold text-white">
            Add Subject
          </h2>
        </div>

        <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
          {formError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="subject-name" className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Subject Name{" "}
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              ref={firstInputRef}
              id="subject-name"
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              aria-required="true"
              placeholder="e.g. Chemistry"
              className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
            />
          </div>

          <div>
            <label htmlFor="subject-code" className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Subject Code{" "}
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="subject-code"
              type="text"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              aria-required="true"
              aria-describedby="subject-code-hint"
              placeholder="e.g. CHEM"
              className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
            />
            <p id="subject-code-hint" className="text-xs text-[#8A9CAE] mt-1">
              A short unique code, saved in uppercase.
            </p>
          </div>

          <div className="flex gap-3 pt-2 border-t border-[#E8EEF5] mt-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Add Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectFormModal;
