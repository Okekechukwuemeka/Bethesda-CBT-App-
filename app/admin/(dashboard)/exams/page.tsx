"use client";

import React from "react";
import PageHeader from "@/components/admin/PageHeader";
import PlusIcon from "@/components/icons/PlusIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useExams } from "@/hooks/useExams";
import ExamsList from "@/components/admin/ExamsList";

const ExamsPage: React.FC = () => {
  const {
    exams,
    isLoading,
    error,
    statusMessage,
    examPendingDelete,
    isDeleting,
    forceDeleteWarning,
    requestDelete,
    cancelDelete,
    performDelete,
  } = useExams();
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        description="Create and manage examinations"
        actions={[
          {
            label: "Create Exam",
            href: "/admin/exams/create",
            icon: <PlusIcon />,
            variant: "primary",
          },
        ]}
      />

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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A3A5C]" />
        </div>
      ) : (
        <ExamsList exams={exams} onDelete={requestDelete} />
      )}

      {/* Step 1: normal delete confirmation */}
      <ConfirmDialog
        isOpen={!!examPendingDelete && !forceDeleteWarning}
        title="Delete this exam?"
        description={
          <>
            This will permanently delete <strong>{examPendingDelete?.title}</strong>. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete Exam"
        isDangerous
        isProcessing={isDeleting}
        onConfirm={() => performDelete(false)}
        onCancel={cancelDelete}
      />

      {/* Step 2: only shown if the backend reports existing submissions -
          a second, more explicit confirmation before destroying student
          work, rather than one generic "are you sure" for both cases. */}
      <ConfirmDialog
        isOpen={!!examPendingDelete && !!forceDeleteWarning}
        title="Students have already started this exam"
        description={
          <>
            {forceDeleteWarning} Deleting anyway will also permanently delete all of those student
            submissions. This cannot be undone.
          </>
        }
        confirmLabel="Delete Exam and All Submissions"
        isDangerous
        isProcessing={isDeleting}
        onConfirm={() => performDelete(true)}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default ExamsPage;
