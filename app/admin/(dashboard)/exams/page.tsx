"use client";

import React, { Suspense } from "react";
import PageHeader from "@/components/admin/PageHeader";
import PlusIcon from "@/components/icons/PlusIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { useExams } from "@/hooks/useExams";
import ExamsList from "@/components/admin/ExamsList";
import ExamFilters from "@/components/admin/ExamFilters";

const ExamsPageContent: React.FC = () => {
  const {
    exams,
    pagination,
    pageSize,
    isLoading,
    isRefreshing,
    error,
    statusMessage,
    filters,
    hasActiveFilters,
    setFilter,
    clearFilters,
    setPage,
    subjects,
    isLoadingSubjects,
    examPendingDelete,
    isDeleting,
    requestDelete,
    cancelDelete,
    performDelete,
  } = useExams();

  // The pagination controls sit below a long grid; after changing page, bring
  // the top of the new results into view (and into the reading order for
  // screen-reader users) rather than leaving them at the bottom of the page.
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const handlePageChange = (page: number) => {
    setPage(page);
    resultsRef.current?.focus({ preventScroll: true });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

      <ExamFilters
        filters={filters}
        subjects={subjects}
        isLoadingSubjects={isLoadingSubjects}
        totalCount={pagination.total}
        hasActiveFilters={hasActiveFilters}
        onChange={setFilter}
        onClear={clearFilters}
      />

      <div ref={resultsRef} tabIndex={-1} className="outline-none space-y-4">
        {error ? (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A3A5C]"
              role="status"
              aria-label="Loading exams"
            />
          </div>
        ) : (
          <div
            aria-busy={isRefreshing}
            className={isRefreshing ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <ExamsList
              exams={exams}
              onDelete={requestDelete}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
            <div className="mt-4 bg-white rounded-xl border border-[#C5D8EC] empty:hidden">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                itemLabel="exams"
              />
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!examPendingDelete}
        title="Delete this exam?"
        description={
          <>
            This will permanently delete <strong>{examPendingDelete?.title}</strong>. Its questions
            stay in the Question Bank, and any student results already recorded for it are kept
            under Results. This cannot be undone.
          </>
        }
        confirmLabel="Delete Exam"
        isDangerous
        isProcessing={isDeleting}
        onConfirm={performDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

// useSearchParams (used by the hook to restore filters from the URL) needs a
// Suspense boundary above it so the rest of the route can still prerender.
const ExamsPage: React.FC = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A3A5C]" />
      </div>
    }>
    <ExamsPageContent />
  </Suspense>
);

export default ExamsPage;
