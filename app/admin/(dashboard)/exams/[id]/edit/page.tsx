"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

type RequiredField = "title" | "subject" | "class" | "term" | "date" | "time";
type FieldErrors = Partial<Record<RequiredField, string>>;

// Same focus-trap pattern used on the Exam Questions modal. Traps Tab/Shift+Tab
// inside the dialog, closes on Escape, and returns focus to whatever opened it.
// Worth extracting into a shared AccessibleModal component once a third modal
// shows up (Students delete confirmation will likely need this too).
function useModalFocusTrap(
  isOpen: boolean,
  modalRef: React.RefObject<HTMLElement | null>,
  triggerRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  canClose: boolean,
) {
  useEffect(() => {
    if (!isOpen) return;
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      Array.from(modalEl.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => el.offsetParent !== null,
      );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canClose) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, canClose]);
}

const EditExamPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Partial<Record<RequiredField, HTMLElement | null>>>({});
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    class: "",
    term: "",
    date: "",
    time: "",
    duration: 60,
    type: "objective" as "objective" | "theory" | "mixed",
    instructions: "",
    passingScore: 40,
    shuffleQuestions: false,
    status: "scheduled" as "scheduled" | "ongoing" | "completed",
  });

  const closeDeleteConfirm = () => {
    if (isSubmitting) return;
    setShowDeleteConfirm(false);
  };

  useModalFocusTrap(
    showDeleteConfirm,
    deleteModalRef,
    deleteButtonRef,
    closeDeleteConfirm,
    !isSubmitting,
  );

  // Load exam data
  useEffect(() => {
    // TODO (integration): replace with a real GET /api/exams/:id
    setTimeout(() => {
      const mockExam = {
        id: parseInt(examId),
        title: "Chemistry First Term Examination",
        subject: "Chemistry",
        class: "JSS3",
        term: "First Term",
        date: "2025-06-23",
        time: "07:00",
        duration: 120,
        type: "objective" as "objective" | "theory" | "mixed",
        instructions: "Read all questions carefully. Select the best answer for each question.",
        passingScore: 40,
        shuffleQuestions: false,
        status: "scheduled" as "scheduled" | "ongoing" | "completed",
      };
      setFormData(mockExam);
      setIsLoading(false);
    }, 800);
  }, [examId]);

  // Move focus into the form once loading finishes, so a screen reader user
  // knows the page is ready rather than being left on nothing in particular.
  useEffect(() => {
    if (!isLoading) {
      titleInputRef.current?.focus();
    }
  }, [isLoading]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
    }));

    if (name in fieldErrors) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name as RequiredField];
        return next;
      });
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.title.trim()) errors.title = "Exam title is required.";
    if (!formData.subject.trim()) errors.subject = "Subject is required.";
    if (!formData.class) errors.class = "Please select a class.";
    if (!formData.term) errors.term = "Please select a term.";
    if (!formData.date) errors.date = "Exam date is required.";
    if (!formData.time) errors.time = "Exam time is required.";
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);

    const errorFields = Object.keys(errors) as RequiredField[];
    if (errorFields.length > 0) {
      setStatusMessage({
        type: "error",
        text: `Please fix ${errorFields.length} field${errorFields.length > 1 ? "s" : ""} before submitting.`,
      });
      fieldRefs.current[errorFields[0]]?.focus();
      return;
    }

    setStatusMessage(null);
    setIsSubmitting(true);

    // TODO (integration): PUT to /api/exams/:id instead of this mock delay.
    setTimeout(() => {
      setStatusMessage({ type: "success", text: "Exam updated successfully." });
      setIsSubmitting(false);
      // No forced redirect — the admin can review the confirmation and
      // navigate away using "Cancel" / "Back" whenever they're ready.
    }, 1000);
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    deleteButtonRef.current = e.currentTarget;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    setIsSubmitting(true);

    // TODO (integration): DELETE /api/exams/:id instead of this mock delay.
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDeleted(true);
    }, 1000);
  };

  const getStatusOptions = () => [
    { value: "scheduled", label: "Scheduled" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
  ];

  const errorId = (field: RequiredField) => `${field}-error`;
  const describedBy = (field: RequiredField) => (fieldErrors[field] ? errorId(field) : undefined);

  if (isDeleted) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h1 className="text-xl font-bold text-[#1A3A5C]">Exam Deleted</h1>
        <p className="text-[#5A7A9A]">
          &ldquo;{formData.title}&rdquo; and all associated questions and results have been
          permanently deleted.
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/exams")}
          className="inline-block bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2.5 rounded-lg transition focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
          Return to Exams List
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        role="status"
        aria-live="polite">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
            aria-hidden="true"></div>
          <p className="mt-4 text-[#4A6A8A]">Loading exam details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6" inert={showDeleteConfirm ? ("" as unknown as true) : undefined}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A3A5C]">Edit Exam</h1>
            <p className="text-[#5A7A9A] text-sm">Update examination details</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/exams"
              className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Cancel
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-red-500/50 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            role={statusMessage.type === "error" ? "alert" : "status"}
            aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
            className={`p-4 rounded-lg text-sm font-medium ${
              statusMessage.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : statusMessage.type === "warning"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-red-100 text-red-800 border border-red-300"
            }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <fieldset className="space-y-6">
              <legend className="text-base font-semibold text-[#1A3A5C] mb-4">Exam Details</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Exam Title{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    ref={(el) => {
                      titleInputRef.current = el;
                      fieldRefs.current.title = el;
                    }}
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.title}
                    aria-describedby={describedBy("title")}
                    placeholder="e.g., Chemistry First Term Examination"
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                  {fieldErrors.title && (
                    <p id={errorId("title")} className="mt-1 text-sm text-red-600">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Subject{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    ref={(el) => {
                      fieldRefs.current.subject = el;
                    }}
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.subject}
                    aria-describedby={describedBy("subject")}
                    placeholder="e.g., Chemistry"
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                  {fieldErrors.subject && (
                    <p id={errorId("subject")} className="mt-1 text-sm text-red-600">
                      {fieldErrors.subject}
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
                    ref={(el) => {
                      fieldRefs.current.class = el;
                    }}
                    id="class"
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.class}
                    aria-describedby={describedBy("class")}
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                    <option value="">Select Class</option>
                    <option value="JSS1">JSS1</option>
                    <option value="JSS2">JSS2</option>
                    <option value="JSS3">JSS3</option>
                    <option value="SS1">SS1</option>
                    <option value="SS2">SS2</option>
                    <option value="SS3">SS3</option>
                  </select>
                  {fieldErrors.class && (
                    <p id={errorId("class")} className="mt-1 text-sm text-red-600">
                      {fieldErrors.class}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="term" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Term{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    ref={(el) => {
                      fieldRefs.current.term = el;
                    }}
                    id="term"
                    name="term"
                    value={formData.term}
                    onChange={handleInputChange}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.term}
                    aria-describedby={describedBy("term")}
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                    <option value="">Select Term</option>
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                  {fieldErrors.term && (
                    <p id={errorId("term")} className="mt-1 text-sm text-red-600">
                      {fieldErrors.term}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Exam Type{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    aria-required="true"
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                    <option value="objective">Objective (MCQ)</option>
                    <option value="theory">Theory (Essay)</option>
                    <option value="mixed">Mixed (Both)</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-6 pt-2 border-t border-[#E8EEF5]">
              <legend className="text-base font-semibold text-[#1A3A5C] mb-4 pt-4">
                Schedule &amp; Status
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Duration (minutes){" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    aria-required="true"
                    aria-describedby="duration-hint"
                    min="15"
                    max="180"
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                  <p id="duration-hint" className="mt-1 text-xs text-[#8A9CAE]">
                    Between 15 and 180 minutes.
                  </p>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Status{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    aria-required="true"
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                    {getStatusOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Exam Date{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    ref={(el) => {
                      fieldRefs.current.date = el;
                    }}
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.date}
                    aria-describedby={describedBy("date")}
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                  {fieldErrors.date && (
                    <p id={errorId("date")} className="mt-1 text-sm text-red-600">
                      {fieldErrors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Exam Time{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    ref={(el) => {
                      fieldRefs.current.time = el;
                    }}
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.time}
                    aria-describedby={describedBy("time")}
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                  {fieldErrors.time && (
                    <p id={errorId("time")} className="mt-1 text-sm text-red-600">
                      {fieldErrors.time}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-6 pt-2 border-t border-[#E8EEF5]">
              <legend className="text-base font-semibold text-[#1A3A5C] mb-4 pt-4">
                Scoring &amp; Behavior
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="passingScore"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    id="passingScore"
                    name="passingScore"
                    value={formData.passingScore}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="shuffleQuestions"
                      name="shuffleQuestions"
                      checked={formData.shuffleQuestions}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
                    />
                    <span className="text-sm text-[#1A3A5C] font-medium">
                      Shuffle questions for each student
                    </span>
                  </label>
                </div>
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Exam Instructions
              </label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows={4}
                placeholder="Enter exam instructions for students..."
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] resize-y"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#E8EEF5]">
              <Link
                href="/admin/exams"
                className="flex-1 text-center bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isSubmitting ? "Saving changes, please wait" : "Update exam"}>
                {isSubmitting ? "Saving..." : "Update Exam"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal — outside the inert wrapper so it stays interactive */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteConfirm();
          }}>
          <div
            ref={deleteModalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#B8D0E8]">
            <div className="bg-red-600 -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
              <h2 id="delete-title" className="text-xl font-bold text-white">
                Delete Exam
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-[#4A6A8A] mb-4">
                Are you sure you want to delete <strong>{formData.title}</strong>?
              </p>
              <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-4">
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Subject:</span> {formData.subject}
                </p>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Class:</span> {formData.class}
                </p>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Questions:</span> This will delete all questions
                  associated with this exam
                </p>
              </div>
              <p className="text-sm text-red-600 mb-4">
                <span aria-hidden="true">⚠️ </span>
                This action cannot be undone. All student results and data for this exam will be
                permanently deleted.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeDeleteConfirm}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 active:scale-[0.98]">
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditExamPage;
