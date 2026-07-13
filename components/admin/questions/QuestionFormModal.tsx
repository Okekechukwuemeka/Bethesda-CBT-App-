import React, { useEffect, useRef } from "react";
import type { QuestionInput, Subject } from "@/types/question";
import { CLASS_LEVELS } from "@/lib/models/constants";

interface QuestionFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: QuestionInput;
  formError: string | null;
  isSubmitting: boolean;
  subjects: Subject[];
  isLoadingSubjects: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onOptionChange: (index: number, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  isEditing,
  formData,
  formError,
  isSubmitting,
  subjects,
  isLoadingSubjects,
  onChange,
  onOptionChange,
  onSubmit,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      firstInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    };

    const handleTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
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
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}>
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
        <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            {isEditing ? "Edit Question" : "Add Question to Bank"}
          </h2>
        </div>

        <form onSubmit={onSubmit} noValidate className="p-6">
          <div className="space-y-4">
            {formError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="text" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Question Text{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                ref={firstInputRef}
                id="text"
                name="text"
                value={formData.text || ""}
                onChange={onChange}
                aria-required="true"
                rows={3}
                className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Question Type{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type || "Objective"}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                  <option value="Objective">Objective (MCQ)</option>
                  <option value="Theory">Theory (Essay)</option>
                </select>
              </div>

              <div>
                <label htmlFor="marks" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Marks{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  type="number"
                  id="marks"
                  name="marks"
                  value={formData.marks || 5}
                  onChange={onChange}
                  aria-required="true"
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Subject{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject || ""}
                  onChange={onChange}
                  disabled={isLoadingSubjects}
                  aria-required="true"
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60">
                  <option value="">
                    {isLoadingSubjects ? "Loading subjects…" : "Select a subject"}
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {subjects.length === 0 && !isLoadingSubjects && (
                  <p className="text-xs text-[#8A9CAE] mt-1">
                    No subjects yet — use “Add Subject” above the table first.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="class" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Class{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <select
                  id="class"
                  name="class"
                  value={formData.class || ""}
                  onChange={onChange}
                  aria-required="true"
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                  <option value="">Select a class</option>
                  {CLASS_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="correctAnswer"
                  className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Correct Answer{" "}
                  {formData.type === "Objective" && (
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  id="correctAnswer"
                  name="correctAnswer"
                  value={formData.correctAnswer || ""}
                  onChange={onChange}
                  aria-required={formData.type === "Objective"}
                  placeholder={
                    formData.type === "Objective"
                      ? "Enter the correct option (e.g., H2O)"
                      : "Optional for theory"
                  }
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
              </div>
            </div>

            {formData.type === "Objective" && (
              <div>
                <label className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Options{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        optionRefs.current[index] = el;
                      }}
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      value={formData.options?.[index] || ""}
                      onChange={(e) => onOptionChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                      aria-label={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-[#E8EEF5]">
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
              {isSubmitting ? "Saving..." : isEditing ? "Update Question" : "Add Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionFormModal;
