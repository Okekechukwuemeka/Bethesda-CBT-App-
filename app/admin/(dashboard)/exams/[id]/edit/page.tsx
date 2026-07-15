"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DeleteConfirmModal from "@/components/admin/edit-exam/DeleteConfirmModal";
import LoadingExamState from "@/components/admin/exam-form/LoadingExamState";
import ExamDeletedState from "@/components/admin/edit-exam/ExamDeletedState";
import ExamDetailsFormSection from "@/components/admin/edit-exam/ExamDetailsFormSection";
import ScheduleStatusFormSection from "@/components/admin/edit-exam/ScheduleStatusFormSection";
import ScoringBehaviorFormSection from "@/components/admin/edit-exam/ScoringBehaviorFormSection";
import InstructionsFormSection from "@/components/admin/edit-exam/InstructionsFormSection";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useEditExam } from "@/hooks/useEditExam";

const EditExamPage: React.FC = () => {
  const params = useParams();
  const examId = params?.id as string;
  const [copied, setCopied] = useState(false);

  const {
    isLoading,
    isSubmitting,
    isDeleted,
    statusMessage,
    fieldErrors,
    showDeleteConfirm,
    forceDeleteWarning,
    subjects,
    loadError,
    formData,
    examCode,
    titleInputRef,
    fieldRefs,
    handleInputChange,
    handleSubmit,
    handleDelete,
    cancelDeleteConfirm,
    performDelete,
  } = useEditExam(examId);

  if (isDeleted) {
    return <ExamDeletedState examTitle={formData.title} />;
  }

  if (isLoading) {
    return <LoadingExamState />;
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{loadError}</div>
    );
  }

  const subjectName = subjects.find((s) => s.id === formData.subject)?.name ?? formData.subject;

  const copyCode = async () => {
    if (!examCode) return;
    try {
      await navigator.clipboard.writeText(examCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  };

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

        {/* Exam Code - fulfills the promise made on the Create Exam success
            screen ("You can find it again on the exam's edit page later") */}
        {examCode && (
          <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-medium text-[#5A7A9A] uppercase tracking-wide">
                Exam Code
              </p>
              <p className="text-lg font-mono font-bold text-[#1A3A5C] select-all tracking-wider">
                {examCode}
              </p>
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="text-sm px-3 py-1.5 rounded-lg border border-[#2B6CB0] text-[#2B6CB0] hover:bg-[#E8F0FE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
              aria-label={`Copy exam code ${examCode}`}>
              {copied ? "Copied" : "Copy"}
            </button>
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
              subjects={subjects}
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
        isOpen={showDeleteConfirm && !forceDeleteWarning}
        examTitle={formData.title}
        examSubject={subjectName}
        examClass={formData.class}
        isProcessing={isSubmitting}
        onConfirm={() => performDelete(false)}
        onCancel={cancelDeleteConfirm}
      />

      {/* Second step - only when the backend reports existing submissions */}
      <ConfirmDialog
        isOpen={showDeleteConfirm && !!forceDeleteWarning}
        title="Students have already started this exam"
        description={
          <>
            {forceDeleteWarning} Deleting anyway will also permanently delete all of those student
            submissions. This cannot be undone.
          </>
        }
        confirmLabel="Delete Exam and All Submissions"
        isDangerous
        isProcessing={isSubmitting}
        onConfirm={() => performDelete(true)}
        onCancel={cancelDeleteConfirm}
      />
    </>
  );
};

export default EditExamPage;
