"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatsSummary from "@/components/admin/results/StatsSummary";
import SubjectResultsTable from "@/components/admin/results/SubjectResultsTable";
import { useTeacherClassResults } from "@/hooks/useTeacherClassResults";

const TeacherClassResultsPage: React.FC = () => {
  const params = useParams<{ className: string }>();
  const className = decodeURIComponent(params.className);

  const {
    subjects,
    isLoading,
    subjectsError,
    statusMessage,
    exportingId,
    exportExcel,
    exportCsv,
    exportAllScripts,
  } = useTeacherClassResults(className);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">{className} Results</h1>
          <p className="text-[#5A7A9A] text-sm">Your assigned subjects for this class</p>
        </div>
        <Link
          href="/staff/results"
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#E8EEF5] px-4 py-2 text-sm font-medium text-[#1A3A5C] transition duration-200 hover:bg-[#D5DFE8] focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Classes
        </Link>
      </div>

      {statusMessage && (
        <div
          role={statusMessage.type === "error" ? "alert" : "status"}
          aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
          className={`p-4 rounded-lg text-sm font-medium ${statusMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
          {statusMessage.text}
        </div>
      )}

      {isLoading ? (
        <p role="status" aria-live="polite" className="text-center text-[#5A7A9A] py-12">
          Loading exams…
        </p>
      ) : subjectsError ? (
        <div role="alert" aria-live="assertive" className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
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
              `/staff/results/${encodeURIComponent(className)}/${subject.id}`
            }
          />
        </>
      )}

    </div>
  );
};

export default TeacherClassResultsPage;
