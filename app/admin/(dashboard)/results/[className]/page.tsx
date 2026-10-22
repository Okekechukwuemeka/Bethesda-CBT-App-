"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatsSummary from "@/components/admin/results/StatsSummary";
import SubjectResultsTable from "@/components/admin/results/SubjectResultsTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useClassResults } from "@/hooks/useClassResults";

const ClassResultsPage: React.FC = () => {
  const params = useParams<{ className: string }>();
  const className = decodeURIComponent(params.className);

  const {
    subjects,
    isLoading,
    subjectsError,
    statusMessage,
    exportingId,
    isExportingClass,
    exportExcel,
    exportCsv,
    exportAllScripts,
    exportClassResults,
    exportClassCsv,
    resultsPendingDelete,
    isDeletingResults,
    requestDeleteResults,
    cancelDeleteResults,
    confirmDeleteResults,
  } = useClassResults(className);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">{className} Results</h1>
          <p className="text-[#5A7A9A] text-sm">View and manage subject results</p>
        </div>
        {/* Equal-width, equal-height buttons in one tidy row (stacked on
            phones), instead of buttons of different widths wrapping raggedly. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <Link
            href="/admin/results"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#E8EEF5] px-4 py-2 text-sm font-medium text-[#1A3A5C] transition duration-200 hover:bg-[#D5DFE8] focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
            <svg
              className="h-5 w-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Classes
          </Link>
          {subjects.length > 0 && (
            <button
              type="button"
              onClick={exportClassCsv}
              disabled={isExportingClass}
              aria-label="Download class CSV for all subjects"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-md transition duration-200 hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-50">
              {isExportingClass ? "Preparing..." : "Download Class CSV"}
            </button>
          )}
          {subjects.length > 0 && (
            <button
              type="button"
              onClick={exportClassResults}
              disabled={isExportingClass}
              aria-label="Download class results spreadsheet for all subjects"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1A3A5C] px-4 py-2 text-sm font-medium text-white shadow-md transition duration-200 hover:bg-[#14304D] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
              {isExportingClass ? "Preparing..." : "Download Class Results"}
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          role={statusMessage.type === "error" ? "alert" : "status"}
          aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
          className={`p-4 rounded-lg text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}>
          {statusMessage.text}
        </div>
      )}

      {isLoading ? (
        <p role="status" aria-live="polite" className="text-center text-[#5A7A9A] py-12">
          Loading exams...
        </p>
      ) : subjectsError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {subjectsError}
        </div>
      ) : (
        <>
          <StatsSummary subjects={subjects} />
          <SubjectResultsTable
            subjects={subjects}
            className={className}
            exportingId={exportingId}
            onExportExcel={exportExcel}
            onExportCsv={exportCsv}
            onExportAllScripts={exportAllScripts}
            getStudentsHref={(subject) =>
              `/admin/results/${encodeURIComponent(className)}/${subject.id}`
            }
            onDeleteResults={requestDeleteResults}
          />
        </>
      )}


      <ConfirmDialog
        isOpen={!!resultsPendingDelete}
        title="Delete these saved results?"
        description={
          <>
            The exam <strong>{resultsPendingDelete?.examTitle}</strong> (
            {resultsPendingDelete?.subject}) was deleted earlier, but its student results were
            kept. This will permanently delete those results
            {resultsPendingDelete?.completed
              ? ` (${resultsPendingDelete.completed} marked so far)`
              : ""}
            . This cannot be undone.
          </>
        }
        confirmLabel="Delete Results"
        isDangerous
        isProcessing={isDeletingResults}
        onConfirm={confirmDeleteResults}
        onCancel={cancelDeleteResults}
      />
    </div>
  );
};

export default ClassResultsPage;
