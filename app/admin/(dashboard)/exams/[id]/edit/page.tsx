// app/admin/exams/[id]/edit/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DeleteConfirmModal from "@/components/admin/edit-exam/DeleteConfirmModal";
import LoadingExamState from "@/components/admin/exam-form/LoadingExamState";
import ExamDeletedState from "@/components/admin/edit-exam/ExamDeletedState";
import ExamDetailsFormSection from "@/components/admin/edit-exam/ExamDetailsFormSection";
import ScheduleStatusFormSection from "@/components/admin/edit-exam/ScheduleStatusFormSection";
import ScoringBehaviorFormSection from "@/components/admin/edit-exam/ScoringBehaviorFormSection";
import InstructionsFormSection from "@/components/admin/edit-exam/InstructionsFormSection";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

type RequiredField = "title" | "subject" | "class" | "term" | "date" | "time";
type FieldErrors = Partial<Record<RequiredField, string>>;

const EditExamPage: React.FC = () => {
  const params = useParams();
  const examId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    status: "scheduled" as "scheduled" | "ongoing" | "completed",
  });

  // Load exam data
  useEffect(() => {
    setTimeout(() => {
      const mockExam = {
        title: "Chemistry First Term Examination",
        subject: "Chemistry",
        class: "JSS3",
        term: "First Term",
        date: "2025-06-23",
        time: "07:00",
        duration: 120,
        type: "objective" as const,
        instructions: "Read all questions carefully.",
        passingScore: 40,
        shuffleQuestions: false,
        status: "scheduled" as const,
      };
      setFormData(mockExam);
      setIsLoading(false);
    }, 800);
  }, [examId]);

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

    setTimeout(() => {
      setStatusMessage({ type: "success", text: "Exam updated successfully." });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsDeleted(true);
    }, 1000);
  };

  if (isDeleted) {
    return <ExamDeletedState examTitle={formData.title} />;
  }

  if (isLoading) {
    return <LoadingExamState />;
  }

  return (
    <>
      <div className="space-y-6">
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
                aria-hidden="true">
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
                aria-hidden="true">
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
            <ExamDetailsFormSection
              formData={formData}
              fieldErrors={fieldErrors}
              titleInputRef={titleInputRef}
              fieldRefs={fieldRefs}
              onChange={handleInputChange}
            />

            <ScheduleStatusFormSection
              formData={formData}
              fieldErrors={fieldErrors}
              fieldRefs={fieldRefs}
              onChange={handleInputChange}
            />

            <ScoringBehaviorFormSection formData={formData} onChange={handleInputChange} />

            <InstructionsFormSection formData={formData} onChange={handleInputChange} />

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

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        examTitle={formData.title}
        examSubject={formData.subject}
        examClass={formData.class}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};

export default EditExamPage;
