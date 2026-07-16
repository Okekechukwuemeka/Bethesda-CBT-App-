"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatsSummary from "@/components/admin/results/StatsSummary";
import SubjectResultsTable from "@/components/admin/results/SubjectResultsTable";
import StudentScriptsModal from "@/components/admin/results/StudentScriptsModal";
import { useClassResults } from "@/hooks/useClassResults";

const ClassResultsPage: React.FC = () => {
  const params = useParams<{ className: string }>();
  const className = decodeURIComponent(params.className);

  const {
    subjects,
    isLoading,
    error,
    statusMessage,
    studentsByExam,
    loadingStudentsFor,
    selectedSubject,
    showScriptModal,
    exportingId,
    isExportingClass,
    handleViewScripts,
    closeScriptModal,
    exportExcel,
    exportAllScripts,
    exportSingleScript,
    exportClassResults,
  } = useClassResults(className);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">{className} Results</h1>
          <p className="text-[#5A7A9A] text-sm">View and manage subject results</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          {subjects.length > 0 && (
            <button
              type="button"
              onClick={exportClassResults}
              disabled={isExportingClass}
              className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
              {isExportingClass ? "Preparing..." : "Download Class Results (All Subjects)"}
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
      ) : error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {error}
        </div>
      ) : (
        <>
          <StatsSummary subjects={subjects} />
          <SubjectResultsTable
            subjects={subjects}
            className={className}
            exportingId={exportingId}
            onExportExcel={exportExcel}
            onExportAllScripts={exportAllScripts}
            onViewScripts={handleViewScripts}
          />
        </>
      )}

      <StudentScriptsModal
        isOpen={showScriptModal}
        subject={selectedSubject}
        students={selectedSubject ? studentsByExam[selectedSubject.id] : undefined}
        isLoading={selectedSubject ? loadingStudentsFor === selectedSubject.id : false}
        onClose={closeScriptModal}
        onDownloadScript={(student) =>
          selectedSubject && exportSingleScript(selectedSubject, student)
        }
        onDownloadAll={() => selectedSubject && exportAllScripts(selectedSubject)}
      />
    </div>
  );
};

export default ClassResultsPage;
