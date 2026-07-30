import React, { useEffect, useRef } from "react";
import type { Passage, QuestionInput, Subject } from "@/types/question";
import { CLASS_LEVELS, PASSAGE_KINDS } from "@/lib/models/constants";

interface NewPassageData {
  title: string;
  text: string;
  kind: string;
}

interface QuestionFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: QuestionInput;
  formError: string | null;
  isSubmitting: boolean;
  subjects: Subject[];
  isLoadingSubjects: boolean;
  passages: Passage[];
  isLoadingPassages: boolean;
  newPassageData: NewPassageData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onNewPassageChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  isEditing,
  formData,
  formError,
  isSubmitting,
  subjects,
  isLoadingSubjects,
  passages,
  isLoadingPassages,
  newPassageData,
  onChange,
  onNewPassageChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onSubmit,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);
  const newPassageTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      firstInputRef.current?.focus();
    }
  }, [isOpen]);

  // When the admin switches the passage picker to "create a new passage",
  // move focus straight to the new title field - the new fields appear
  // right there in the form, but a screen-reader user has no visual cue
  // that they showed up unless focus actually moves to them.
  useEffect(() => {
    if (formData.passageId === "__new__") {
      newPassageTitleRef.current?.focus();
    }
  }, [formData.passageId]);

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

  // Only passages in the same subject+class as the question being edited
  // are offered - a passage is scoped to one subject/class at creation
  // (see PassageManagerModal), so mixing would create a mismatch the
  // backend doesn't enforce but the UI shouldn't offer in the first place.
  const relevantPassages = passages.filter(
    (p) =>
      (typeof p.subject === "string" ? p.subject : p.subject._id) === formData.subject &&
      p.class === formData.class,
  );

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
                  value={formData.marks || 1}
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
                {formData.type === "Objective" ? (
                  <select
                    id="correctAnswer"
                    name="correctAnswer"
                    value={formData.correctAnswer || ""}
                    onChange={onChange}
                    aria-required="true"
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                    <option value="">Select the correct option</option>
                    {(formData.options || [])
                      .filter((opt) => opt.trim())
                      .map((opt, i) => (
                        <option key={i} value={opt}>
                          {String.fromCharCode(65 + i)}. {opt}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="correctAnswer"
                    name="correctAnswer"
                    value={formData.correctAnswer || ""}
                    onChange={onChange}
                    placeholder="Optional for theory"
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                )}
              </div>
            </div>

            {formData.type === "Objective" && (
              <div>
                <label className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Options{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                  <span className="text-xs font-normal text-[#8A9CAE] ml-2">(minimum 2)</span>
                </label>
                <div className="space-y-2">
                  {(formData.options || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-[#5A7A9A] w-5 flex-shrink-0">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        value={option}
                        onChange={(e) => onOptionChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                        aria-label={`Option ${String.fromCharCode(65 + index)}`}
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveOption(index)}
                        disabled={(formData.options || []).length <= 2}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label={`Remove option ${String.fromCharCode(65 + index)}`}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onAddOption}
                  className="mt-2 text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-2 py-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Option
                </button>
              </div>
            )}

            {/* --- Passage picker --- */}
            <div className="border-t border-[#E8EEF5] pt-4">
              <label htmlFor="passageId" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Passage
              </label>
              <p className="text-xs text-[#8A9CAE] mb-2">
                If this question shares a reading passage, experiment write-up, or other stimulus
                with other questions, attach it here so students see the shared text once, followed
                by all its questions together.
              </p>
              <select
                id="passageId"
                name="passageId"
                value={formData.passageId || ""}
                onChange={onChange}
                disabled={!formData.subject || !formData.class}
                className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60">
                <option value="">Not part of a passage</option>
                {isLoadingPassages ? (
                  <option disabled>Loading passages…</option>
                ) : (
                  relevantPassages.map((passage) => (
                    <option key={passage._id} value={passage._id}>
                      {passage.title || "Untitled passage"} ({passage.questionCount} question
                      {passage.questionCount !== 1 ? "s" : ""} so far)
                    </option>
                  ))
                )}
                <option value="__new__">+ Create a new passage…</option>
              </select>
              {(!formData.subject || !formData.class) && (
                <p className="text-xs text-[#8A9CAE] mt-1">
                  Select a subject and class above first, so only passages for that subject and
                  class are offered.
                </p>
              )}

              {formData.passageId === "__new__" && (
                <div className="mt-3 space-y-3 bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4">
                  <div>
                    <label
                      htmlFor="new-passage-title"
                      className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      New Passage Title{" "}
                      <span className="text-xs font-normal text-[#8A9CAE]">(optional)</span>
                    </label>
                    <input
                      ref={newPassageTitleRef}
                      type="text"
                      id="new-passage-title"
                      name="title"
                      value={newPassageData.title}
                      onChange={onNewPassageChange}
                      placeholder="e.g. A VISIT TO THE ZOO"
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-passage-text"
                      className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      New Passage Text{" "}
                      <span className="text-red-500" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <textarea
                      id="new-passage-text"
                      name="text"
                      value={newPassageData.text}
                      onChange={onNewPassageChange}
                      aria-required="true"
                      rows={6}
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-white resize-y"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-passage-kind"
                      className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      Kind
                    </label>
                    <select
                      id="new-passage-kind"
                      name="kind"
                      value={newPassageData.kind}
                      onChange={onNewPassageChange}
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-white">
                      {PASSAGE_KINDS.map((kind) => (
                        <option key={kind} value={kind}>
                          {kindLabel(kind)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-[#8A9CAE]">
                    This question will become the first question in the new passage. Add its other
                    questions afterward by picking this same passage from the list above.
                  </p>
                </div>
              )}
            </div>
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
