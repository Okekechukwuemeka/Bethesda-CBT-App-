"use client";

import React from "react";
import Link from "next/link";
import { useModalFocusTrap } from "@/hooks/useModalFocusTrap";
import StatsSummary from "@/components/admin/results/StatsSummary";
import SubjectResultsTable from "@/components/admin/results/SubjectResultsTable";
import StudentScriptsModal from "@/components/admin/results/StudentScriptsModal";
import { useClassResults } from "@/hooks/useClassResults";

const ClassResultsPage: React.FC = () => {
  const {
    className,
    subjectResults,
    studentScripts,
    selectedSubject,
    showScriptModal,
    isLoading,
    statusMessage,
    triggerRef,
    handleViewScripts,
    closeScriptModal,
    handleViewStudentScript,
    handleDownloadClassResult,
  } = useClassResults();

  const modalRef = React.useRef<HTMLDivElement>(null);

  useModalFocusTrap(showScriptModal, modalRef, triggerRef, closeScriptModal, true);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A3A5C]">{className} Results</h1>
            <p className="text-[#5A7A9A] text-sm">View and manage subject results</p>
          </div>
          <Link
            href="/admin/results"
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
            Back to Classes
          </Link>
        </div>

        {!showScriptModal && statusMessage && (
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

        {/* Stats Summary */}
        <StatsSummary subjectResults={subjectResults} />

        {/* Subject Results Table */}
        <SubjectResultsTable
          subjectResults={subjectResults}
          className={className}
          isLoading={isLoading}
          onDownloadResult={handleDownloadClassResult}
          onViewScripts={handleViewScripts}
        />
      </div>

      {/* Student Scripts Modal */}
      {selectedSubject && (
        <StudentScriptsModal
          isOpen={showScriptModal}
          className={className}
          subject={selectedSubject}
          students={studentScripts}
          isLoading={isLoading}
          statusMessage={statusMessage}
          onClose={closeScriptModal}
          onDownloadScript={handleViewStudentScript}
          onDownloadAll={() => handleDownloadClassResult(selectedSubject)}
        />
      )}
    </>
  );
};

export default ClassResultsPage;
