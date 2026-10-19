"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ExaminationStatusBadge,
  PaperStatusBadge,
} from "@/components/admin/students/profile/ResultStatusBadges";
import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatScore,
} from "@/components/admin/students/profile/format";
import type { ExaminationDetailResponse, PaperResult } from "@/types/student-profile";

const thClass =
  "px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider whitespace-nowrap";

// What the "Score" cell says for a paper, spelling out anything still unmarked.
function ScoreCell({ paper }: { paper: PaperResult }) {
  if (paper.status === "in-progress") {
    return <span className="text-[#8A9CAE]">Not submitted yet</span>;
  }

  if (paper.status === "marked") {
    return (
      <>
        <span className="font-semibold text-[#1A3A5C]">
          {formatScore(paper.score, paper.totalMarks)}
        </span>
        {paper.percentage !== null && (
          <span className="text-[#4A6A8A]"> ({paper.percentage}%)</span>
        )}
      </>
    );
  }

  // Awaiting marking: nothing is final, but a Mixed paper's MCQ part already is.
  return (
    <>
      <span className="font-medium text-amber-800">Not yet marked</span>
      {paper.objectiveScore !== undefined && paper.objectiveTotal !== undefined && (
        <span className="block text-xs text-[#4A6A8A]">
          Objective so far: {formatScore(paper.objectiveScore, paper.objectiveTotal)}
        </span>
      )}
    </>
  );
}

// The breakdown line under a paper: objective vs essay, and what is outstanding.
function BreakdownCell({ paper }: { paper: PaperResult }) {
  if (paper.type === "Objective") {
    return <span className="text-[#8A9CAE]">Scored automatically</span>;
  }
  return (
    <ul className="space-y-1 text-xs text-[#4A6A8A]">
      {paper.type === "Mixed" && paper.objectiveScore !== undefined && (
        <li>
          Objective: {formatScore(paper.objectiveScore, paper.objectiveTotal)}{" "}
          <span className="text-[#8A9CAE]">(scored automatically)</span>
        </li>
      )}
      {paper.theoryTotal !== undefined && (
        <li>
          Essay (theory):{" "}
          {paper.theoryScore !== null && paper.theoryScore !== undefined ? (
            formatScore(paper.theoryScore, paper.theoryTotal)
          ) : (
            <strong className="text-amber-800">awaiting marking</strong>
          )}
        </li>
      )}
    </ul>
  );
}

const ExaminationDetailPage: React.FC = () => {
  const params = useParams<{ id: string; key: string }>();
  const studentId = params.id;
  const key = params.key;

  const [data, setData] = useState<ExaminationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/admin/students/${studentId}/examinations/${encodeURIComponent(key)}`,
          { cache: "no-store" },
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Failed to load this examination.");
        if (!cancelled) {
          setData(body as ExaminationDetailResponse);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, key]);

  const backHref = `/admin/students/${studentId}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
            aria-hidden="true"
          />
          <p className="mt-4 text-[#4A6A8A]">Loading examination...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="text-[#2B6CB0] hover:underline font-medium">
          <span aria-hidden="true">&larr; </span>Back to student profile
        </Link>
        <div
          role="alert"
          className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {error ?? "Examination not found."}
        </div>
      </div>
    );
  }

  const { student, examination, papers } = data;
  const pendingEssays = papers.filter((p) => p.theoryPending).length;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-block text-[#2B6CB0] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1">
          <span aria-hidden="true">&larr; </span>Back to {student.fullName}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">{examination.name}</h1>
          <p className="text-[#5A7A9A] text-sm">
            {student.fullName} &middot; {student.admissionNumber} &middot; {student.class}
          </p>
        </div>
      </div>

      <section
        aria-labelledby="overview-heading"
        className="bg-white rounded-xl border border-[#C5D8EC] shadow-sm p-6">
        <h2 id="overview-heading" className="sr-only">
          Examination overview
        </h2>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-[#5A7A9A]">Result status</dt>
            <dd className="mt-1">
              <ExaminationStatusBadge status={examination.status} />
            </dd>
          </div>
          <div>
            <dt className="text-[#5A7A9A]">Dates</dt>
            <dd className="font-medium text-[#1A3A5C]">
              {formatDateRange(examination.firstDate, examination.lastDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[#5A7A9A]">Subjects marked</dt>
            <dd className="font-medium text-[#1A3A5C]">
              {examination.markedCount} of {examination.papersTaken}
            </dd>
          </div>
          <div>
            <dt className="text-[#5A7A9A]">Score (marked subjects)</dt>
            <dd className="font-medium text-[#1A3A5C]">
              {examination.percentage === null
                ? "—"
                : `${formatScore(examination.score, examination.totalMarks)} (${examination.percentage}%)`}
            </dd>
          </div>
        </dl>

        {examination.status !== "completed" && (
          <p
            role="note"
            className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
            {examination.status === "in-progress"
              ? "This student has an exam they started but have not submitted yet. "
              : ""}
            {pendingEssays > 0
              ? `${pendingEssays} subject${pendingEssays === 1 ? " has" : "s have"} an essay (theory) section still waiting to be marked. `
              : ""}
            Totals above include marked subjects only, so they will change as marking is completed.
          </p>
        )}
      </section>

      <section aria-labelledby="subjects-heading" className="space-y-3">
        <h2 id="subjects-heading" className="text-lg font-semibold text-[#1A3A5C]">
          Subjects and scores
        </h2>

        <div className="bg-white rounded-xl border border-[#C5D8EC] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">
                Subjects taken by {student.fullName} in {examination.name}, with scores and marking
                status
              </caption>
              <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
                <tr>
                  <th scope="col" className={thClass}>
                    Subject
                  </th>
                  <th scope="col" className={thClass}>
                    Type
                  </th>
                  <th scope="col" className={thClass}>
                    Date
                  </th>
                  <th scope="col" className={thClass}>
                    Score
                  </th>
                  <th scope="col" className={thClass}>
                    Breakdown
                  </th>
                  <th scope="col" className={thClass}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EEF5]">
                {papers.map((paper) => (
                  <tr key={paper.submissionId} className="hover:bg-[#F8FAFE] transition align-top">
                    <th scope="row" className="px-4 py-3 text-left text-sm font-medium text-[#1A3A5C]">
                      {paper.subject}
                      <span className="block text-xs font-normal text-[#8A9CAE]">
                        {paper.title}
                        {paper.examDeleted ? " · exam since deleted, result kept" : ""}
                      </span>
                    </th>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{paper.type}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">
                      {formatDate(paper.examDate)}
                      {paper.submittedAt && (
                        <span className="block text-xs text-[#8A9CAE]">
                          Submitted {formatDateTime(paper.submittedAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <ScoreCell paper={paper} />
                    </td>
                    <td className="px-4 py-3">
                      <BreakdownCell paper={paper} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PaperStatusBadge status={paper.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExaminationDetailPage;
