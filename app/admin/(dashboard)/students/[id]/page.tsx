"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import StudentStatusBadge from "@/components/admin/students/StudentStatusBadge";
import StudentPasswordReset, {
  type ResettableStudent,
} from "@/components/admin/students/StudentPasswordReset";
import {
  ExaminationStatusBadge,
  UpcomingStatusBadge,
} from "@/components/admin/students/profile/ResultStatusBadges";
import {
  formatDate,
  formatDateRange,
  formatScore,
  formatTime,
} from "@/components/admin/students/profile/format";
import { useStudentProfile } from "@/hooks/useStudentProfile";

const cardClass = "bg-white rounded-xl border border-[#C5D8EC] shadow-sm";
const thClass =
  "px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider whitespace-nowrap";

const StudentProfilePage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const studentId = params.id;
  const { data, isLoading, error } = useStudentProfile(studentId);
  const [resetTarget, setResetTarget] = useState<ResettableStudent | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
            aria-hidden="true"
          />
          <p className="mt-4 text-[#4A6A8A]">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/students" className="text-[#2B6CB0] hover:underline font-medium">
          <span aria-hidden="true">&larr; </span>Back to Students
        </Link>
        <div
          role="alert"
          className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {error ?? "Student not found."}
        </div>
      </div>
    );
  }

  const { student, summary, examinations, upcoming } = data;

  return (
    <>
      <div className="space-y-8" inert={resetTarget !== null}>
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/admin/students"
            className="inline-block text-[#2B6CB0] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1">
            <span aria-hidden="true">&larr; </span>Back to Students
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1A3A5C]">{student.fullName}</h1>
              <p className="text-[#5A7A9A] text-sm">
                {student.admissionNumber} &middot; {student.class}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setResetTarget({
                  id: student.id,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  admissionNo: student.admissionNumber,
                })
              }
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md focus:outline-none focus:ring-4 focus:ring-amber-500/50 self-start">
              Reset password
            </button>
          </div>
        </div>

        {/* A. Student information */}
        <section aria-labelledby="info-heading" className={`${cardClass} p-6`}>
          <h2 id="info-heading" className="text-lg font-semibold text-[#1A3A5C] mb-4">
            Student information
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-[#5A7A9A]">Full name</dt>
              <dd className="font-medium text-[#1A3A5C]">{student.fullName}</dd>
            </div>
            <div>
              <dt className="text-[#5A7A9A]">Admission number</dt>
              <dd className="font-medium text-[#1A3A5C]">{student.admissionNumber}</dd>
            </div>
            <div>
              <dt className="text-[#5A7A9A]">Class</dt>
              <dd className="font-medium text-[#1A3A5C]">{student.class}</dd>
            </div>
            <div>
              <dt className="text-[#5A7A9A]">Gender</dt>
              <dd className="font-medium text-[#1A3A5C]">{student.gender ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#5A7A9A]">Account status</dt>
              <dd className="mt-0.5">
                <StudentStatusBadge status={student.status} />
              </dd>
            </div>
            <div>
              <dt className="text-[#5A7A9A]">Enrolled</dt>
              <dd className="font-medium text-[#1A3A5C]">{formatDate(student.enrolledAt)}</dd>
            </div>
          </dl>

          {student.classHistory.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[#1A3A5C] mb-2">Class history</h3>
              <ul className="text-sm text-[#4A6A8A] space-y-1">
                {student.classHistory.map((h, i) => (
                  <li key={`${h.class}-${h.academicYear}-${i}`}>
                    {h.class} &middot; {h.academicYear}
                    {h.from ? ` (${formatDate(h.from)}${h.to ? ` – ${formatDate(h.to)}` : " – present"})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-[#E8EEF5] pt-5">
            <div className="rounded-lg bg-[#F8FAFE] p-3">
              <dt className="text-xs text-[#5A7A9A]">Papers taken</dt>
              <dd className="text-2xl font-bold text-[#1A3A5C]">{summary.papersTaken}</dd>
            </div>
            <div className="rounded-lg bg-[#F8FAFE] p-3">
              <dt className="text-xs text-[#5A7A9A]">Marked</dt>
              <dd className="text-2xl font-bold text-green-700">{summary.papersMarked}</dd>
            </div>
            <div className="rounded-lg bg-[#F8FAFE] p-3">
              <dt className="text-xs text-[#5A7A9A]">Awaiting marking</dt>
              <dd className="text-2xl font-bold text-amber-700">{summary.papersAwaitingMarking}</dd>
            </div>
            <div className="rounded-lg bg-[#F8FAFE] p-3">
              <dt className="text-xs text-[#5A7A9A]">Average (marked papers)</dt>
              <dd className="text-2xl font-bold text-[#1A3A5C]">
                {summary.averagePercentage === null ? "—" : `${summary.averagePercentage}%`}
              </dd>
            </div>
          </dl>
        </section>

        {/* B. Examination history and results */}
        <section aria-labelledby="history-heading" className="space-y-3">
          <div>
            <h2 id="history-heading" className="text-lg font-semibold text-[#1A3A5C]">
              Examination history and results
            </h2>
            <p className="text-sm text-[#5A7A9A]">
              Select an examination to see every subject taken and its score. Essay (theory)
              sections show as awaiting marking until a teacher enters the score.
            </p>
          </div>

          <div className={`${cardClass} overflow-hidden`}>
            {examinations.length === 0 ? (
              <div className="px-4 py-12 text-center text-[#8A9CAE]">
                <p className="font-medium">No examinations taken yet</p>
                <p className="text-sm">Results appear here once the student sits an exam.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <caption className="sr-only">
                    Examinations taken by {student.fullName}, with result status
                  </caption>
                  <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
                    <tr>
                      <th scope="col" className={thClass}>
                        Examination
                      </th>
                      <th scope="col" className={thClass}>
                        Date
                      </th>
                      <th scope="col" className={thClass}>
                        Subjects marked
                      </th>
                      <th scope="col" className={thClass}>
                        Score
                      </th>
                      <th scope="col" className={thClass}>
                        Result status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF5]">
                    {examinations.map((exam) => (
                      <tr key={exam.key} className="hover:bg-[#F8FAFE] transition">
                        <th scope="row" className="px-4 py-3 text-left text-sm font-medium">
                          <Link
                            href={`/admin/students/${student.id}/examinations/${encodeURIComponent(exam.key)}`}
                            className="text-[#2B6CB0] hover:text-[#1A3A5C] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-0.5">
                            {exam.name}
                          </Link>
                        </th>
                        <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">
                          {formatDateRange(exam.firstDate, exam.lastDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">
                          {exam.markedCount} of {exam.papersTaken} marked
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">
                          {exam.percentage === null ? (
                            "—"
                          ) : (
                            <>
                              {formatScore(exam.score, exam.totalMarks)} ({exam.percentage}%)
                              {exam.status !== "completed" && (
                                <span className="block text-xs text-[#8A9CAE]">
                                  marked papers only
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ExaminationStatusBadge status={exam.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* C. Upcoming examinations */}
        <section aria-labelledby="upcoming-heading" className="space-y-3">
          <div>
            <h2 id="upcoming-heading" className="text-lg font-semibold text-[#1A3A5C]">
              Upcoming examinations
            </h2>
            <p className="text-sm text-[#5A7A9A]">
              Exams scheduled for {student.class} that this student has not handed in yet.
            </p>
          </div>

          <div className={`${cardClass} overflow-hidden`}>
            {upcoming.length === 0 ? (
              <div className="px-4 py-12 text-center text-[#8A9CAE]">
                <p className="font-medium">No upcoming examinations</p>
                <p className="text-sm">New exams appear here as soon as they are scheduled.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <caption className="sr-only">
                    Upcoming examinations for {student.fullName}
                  </caption>
                  <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
                    <tr>
                      <th scope="col" className={thClass}>
                        Examination
                      </th>
                      <th scope="col" className={thClass}>
                        Subject
                      </th>
                      <th scope="col" className={thClass}>
                        Date
                      </th>
                      <th scope="col" className={thClass}>
                        Time
                      </th>
                      <th scope="col" className={thClass}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF5]">
                    {upcoming.map((exam) => (
                      <tr key={exam.id} className="hover:bg-[#F8FAFE] transition">
                        <th scope="row" className="px-4 py-3 text-left text-sm font-medium text-[#1A3A5C]">
                          {exam.title}
                          <span className="block text-xs font-normal text-[#8A9CAE]">
                            {exam.type} &middot; {exam.term} {exam.academicYear}
                            {exam.isGeneral ? " · General exam" : ""}
                          </span>
                        </th>
                        <td className="px-4 py-3 text-sm text-[#4A6A8A]">{exam.subject}</td>
                        <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">
                          {formatDate(exam.examDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">
                          {formatTime(exam.examDate)} – {formatTime(exam.endsAt)}
                          <span className="block text-xs text-[#8A9CAE]">
                            {exam.duration} min
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <UpcomingStatusBadge status={exam.status} />
                          {exam.inProgress && (
                            <span className="block text-xs text-[#8A9CAE] mt-1">
                              Started, not submitted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-[#8A9CAE]">
            Times are shown in Nigerian time (WAT). This list refreshes automatically.
          </p>
        </section>
      </div>

      <StudentPasswordReset student={resetTarget} onClose={() => setResetTarget(null)} />
    </>
  );
};

export default StudentProfilePage;
