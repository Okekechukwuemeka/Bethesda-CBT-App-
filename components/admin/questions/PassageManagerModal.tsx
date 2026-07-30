import React, { useEffect, useRef } from "react";
import type { Passage, PassageInput, Subject } from "@/types/question";
import { CLASS_LEVELS, PASSAGE_KINDS } from "@/lib/models/constants";

interface PassageManagerModalProps {
  isOpen: boolean;
  view: "list" | "form";
  passages: Passage[];
  isLoadingPassages: boolean;
  passagesError: string | null;
  subjects: Subject[];
  isLoadingSubjects: boolean;

  editingPassage: Passage | null;
  passageFormData: PassageInput;
  passageFormError: string | null;
  isSavingPassage: boolean;
  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onFormSubmit: (e: React.FormEvent) => void;
  onStartCreate: () => void;
  onStartEdit: (passage: Passage) => void;
  onCancelForm: () => void;

  pendingDeletePassage: Passage | null;
  isDeletingPassage: boolean;
  deletePassageError: string | null;
  deleteBlockedByQuestions: { id: string; text: string }[] | null;
  onRequestDelete: (passage: Passage) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;

  onClose: () => void;
}

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

const subjectLabel = (subject: Passage["subject"]): string =>
  typeof subject === "string" ? subject : (subject as Subject)?.name || "—";

const PassageManagerModal: React.FC<PassageManagerModalProps> = ({
  isOpen,
  view,
  passages,
  isLoadingPassages,
  passagesError,
  subjects,
  isLoadingSubjects,
  editingPassage,
  passageFormData,
  passageFormError,
  isSavingPassage,
  onFormChange,
  onFormSubmit,
  onStartCreate,
  onStartEdit,
  onCancelForm,
  pendingDeletePassage,
  isDeletingPassage,
  deletePassageError,
  deleteBlockedByQuestions,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLElement>(null);

  // Three possible contents share one dialog/focus-trap: the delete
  // confirmation takes priority (it's a blocking sub-step), then the
  // create/edit form, then the list. This avoids ever opening a second
  // modal on top of this one, which would split focus and confuse
  // screen-reader users about where they are.
  const showingDeleteConfirm = !!pendingDeletePassage;
  const showingForm = !showingDeleteConfirm && view === "form";
  const showingList = !showingDeleteConfirm && view === "list";

  const busy = isSavingPassage || isDeletingPassage;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => firstFocusRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, view, pendingDeletePassage]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || busy) return;
      if (showingDeleteConfirm) {
        onCancelDelete();
      } else if (showingForm) {
        onCancelForm();
      } else {
        onClose();
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
  }, [isOpen, busy, showingDeleteConfirm, showingForm, onCancelDelete, onCancelForm, onClose]);

  if (!isOpen) return null;

  const title = showingDeleteConfirm
    ? "Delete this passage?"
    : showingForm
      ? editingPassage
        ? "Edit Passage"
        : "New Passage"
      : "Manage Passages";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="passage-manager-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) {
          if (showingDeleteConfirm) onCancelDelete();
          else if (showingForm) onCancelForm();
          else onClose();
        }
      }}>
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
        <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <h2 id="passage-manager-title" className="text-xl font-bold text-white">
            {title}
          </h2>
        </div>

        <div className="p-6">
          {/* --- Delete confirmation --- */}
          {showingDeleteConfirm && pendingDeletePassage && (
            <div className="space-y-4">
              {deletePassageError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                  {deletePassageError}
                </div>
              )}

              {!deleteBlockedByQuestions ? (
                <p className="text-sm text-[#4A6A8A]">
                  You are about to permanently delete the passage “
                  {pendingDeletePassage.title || "Untitled passage"}”. This cannot be undone.
                </p>
              ) : (
                <div className="text-sm text-[#4A6A8A] space-y-2">
                  <p>
                    This passage still has {deleteBlockedByQuestions.length} question
                    {deleteBlockedByQuestions.length !== 1 ? "s" : ""} attached to it, so it
                    can&apos;t be deleted yet:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {deleteBlockedByQuestions.map((q) => (
                      <li key={q.id}>{q.text}</li>
                    ))}
                  </ul>
                  <p>
                    Edit or delete those questions from the Question Bank first (set them to
                    &quot;not part of a passage&quot;, or delete them), then come back to delete
                    this passage.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  ref={firstFocusRef as React.RefObject<HTMLButtonElement>}
                  onClick={onCancelDelete}
                  disabled={isDeletingPassage}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
                  Cancel
                </button>
                {!deleteBlockedByQuestions && (
                  <button
                    type="button"
                    onClick={onConfirmDelete}
                    disabled={isDeletingPassage}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 disabled:opacity-50">
                    {isDeletingPassage ? "Deleting..." : "Delete passage"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* --- Create / edit form --- */}
          {showingForm && (
            <form onSubmit={onFormSubmit} noValidate className="space-y-4">
              {passageFormError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                  {passageFormError}
                </div>
              )}

              {editingPassage && (
                <p className="text-xs text-[#8A9CAE]">
                  Subject, class, and kind are set when a passage is created and can&apos;t be
                  changed afterward - only the title and text can be edited here.
                </p>
              )}

              <div>
                <label
                  htmlFor="passage-title"
                  className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Title <span className="text-xs font-normal text-[#8A9CAE]">(optional)</span>
                </label>
                <input
                  ref={firstFocusRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  id="passage-title"
                  name="title"
                  value={passageFormData.title || ""}
                  onChange={onFormChange}
                  placeholder="e.g. A VISIT TO THE ZOO"
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
              </div>

              <div>
                <label
                  htmlFor="passage-text"
                  className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Passage Text{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <textarea
                  id="passage-text"
                  name="text"
                  value={passageFormData.text}
                  onChange={onFormChange}
                  aria-required="true"
                  rows={8}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="passage-kind"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Kind
                  </label>
                  <select
                    id="passage-kind"
                    name="kind"
                    value={passageFormData.kind}
                    onChange={onFormChange}
                    disabled={!!editingPassage}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60">
                    {PASSAGE_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kindLabel(kind)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="passage-subject"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Subject{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="passage-subject"
                    name="subject"
                    value={passageFormData.subject}
                    onChange={onFormChange}
                    disabled={isLoadingSubjects || !!editingPassage}
                    aria-required="true"
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60">
                    <option value="">{isLoadingSubjects ? "Loading…" : "Select a subject"}</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="passage-class"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Class{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="passage-class"
                    name="class"
                    value={passageFormData.class}
                    onChange={onFormChange}
                    disabled={!!editingPassage}
                    aria-required="true"
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60">
                    <option value="">Select a class</option>
                    {CLASS_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#E8EEF5] mt-2">
                <button
                  type="button"
                  onClick={onCancelForm}
                  disabled={isSavingPassage}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
                  Back to list
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassage}
                  className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
                  {isSavingPassage
                    ? "Saving..."
                    : editingPassage
                      ? "Update Passage"
                      : "Create Passage"}
                </button>
              </div>
            </form>
          )}

          {/* --- List --- */}
          {showingList && (
            <div className="space-y-4">
              <button
                type="button"
                ref={firstFocusRef as React.RefObject<HTMLButtonElement>}
                onClick={onStartCreate}
                className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
                + New Passage
              </button>

              {passagesError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                  {passagesError}
                </div>
              )}

              {isLoadingPassages ? (
                <p role="status" aria-live="polite" className="text-[#8A9CAE] text-sm">
                  Loading passages…
                </p>
              ) : passages.length === 0 ? (
                <p className="text-[#8A9CAE] text-sm">
                  No passages yet. Create one above, or upload a CSV with passage_key columns from
                  the Bulk Import screen.
                </p>
              ) : (
                <ul className="space-y-3">
                  {passages.map((passage) => (
                    <li
                      key={passage._id}
                      className="border border-[#E8EEF5] rounded-lg p-4 bg-[#F8FAFE]">
                      <h3 className="font-medium text-[#1A3A5C]">
                        {passage.title || "Untitled passage"}
                      </h3>
                      <p className="text-sm text-[#5A7A9A] mt-1">
                        {kindLabel(passage.kind)} · {passage.class} · {passage.questionCount}{" "}
                        question
                        {passage.questionCount !== 1 ? "s" : ""} attached
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => onStartEdit(passage)}
                          className="text-[#2B6CB0] hover:text-[#1A3A5C] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-2 py-1"
                          aria-label={`Edit passage: ${passage.title || "Untitled passage"}`}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(passage)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                          aria-label={`Delete passage: ${passage.title || "Untitled passage"}`}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex pt-2 border-t border-[#E8EEF5]">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PassageManagerModal;
