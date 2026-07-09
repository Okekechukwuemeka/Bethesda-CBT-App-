"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

type RequiredField = "title" | "subject" | "class" | "term" | "date" | "time";
type FieldErrors = Partial<Record<RequiredField, string>>;

const CreateExamPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const titleInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Partial<Record<RequiredField, HTMLElement | null>>>({});

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
  });

  // Focus the first field on load, consistent with the other admin forms.
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
    }));

    // Clear a field's error as soon as the admin starts fixing it.
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

    // TODO (integration): POST to /api/exams instead of this mock delay.
    setTimeout(() => {
      setStatusMessage({
        type: "success",
        text: "Exam created successfully.",
      });
      setIsSubmitted(true);
      setIsSubmitting(false);
      // No forced redirect — the admin chooses what to do next below,
      // so a screen reader isn't cut off mid-announcement.
    }, 1000);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subject: "",
      class: "",
      term: "",
      date: "",
      time: "",
      duration: 60,
      type: "objective",
      instructions: "",
      passingScore: 40,
      shuffleQuestions: false,
    });
    setIsSubmitted(false);
    setStatusMessage(null);
    setFieldErrors({});
    titleInputRef.current?.focus();
  };

  const errorId = (field: RequiredField) => `${field}-error`;
  const describedBy = (field: RequiredField, hasHint = false) => {
    const ids: string[] = [];
    if (fieldErrors[field]) ids.push(errorId(field));
    if (hasHint) ids.push(`${field}-hint`);
    return ids.length ? ids.join(" ") : undefined;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Create Exam</h1>
          <p className="text-[#5A7A9A] text-sm">Create a new examination</p>
        </div>
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
          Back to Exams
        </Link>
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
        {isSubmitted ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-[#1A3A5C]">
              &ldquo;{formData.title}&rdquo; has been created. What would you like to do next?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={resetForm}
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
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* Exam Details */}
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

            {/* Schedule */}
            <fieldset className="space-y-6 pt-2 border-t border-[#E8EEF5]">
              <legend className="text-base font-semibold text-[#1A3A5C] mb-4 pt-4">Schedule</legend>
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

                <div />

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

            {/* Scoring & Behavior */}
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

            {/* Instructions */}
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

            {/* Form Actions */}
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
                aria-label={isSubmitting ? "Creating exam, please wait" : "Create exam"}>
                {isSubmitting ? "Creating..." : "Create Exam"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateExamPage;
