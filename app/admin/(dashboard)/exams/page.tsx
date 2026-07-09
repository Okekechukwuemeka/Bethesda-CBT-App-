"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Exam {
  id: number;
  title: string;
  subject: string;
  class: string;
  term: string;
  date: string;
  time: string;
  duration: number;
  type: "objective" | "theory" | "mixed";
  questionCount: number;
  status: "scheduled" | "ongoing" | "completed";
}

const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([
    {
      id: 1,
      title: "Chemistry First Term Examination",
      subject: "Chemistry",
      class: "JSS3",
      term: "First Term",
      date: "2025-06-23",
      time: "7:00 AM",
      duration: 120,
      type: "objective",
      questionCount: 50,
      status: "scheduled",
    },
    {
      id: 2,
      title: "Physics First Term Examination",
      subject: "Physics",
      class: "JSS3",
      term: "First Term",
      date: "2025-06-27",
      time: "7:00 AM",
      duration: 120,
      type: "theory",
      questionCount: 5,
      status: "scheduled",
    },
    {
      id: 3,
      title: "Mathematics First Term Examination",
      subject: "Mathematics",
      class: "JSS3",
      term: "First Term",
      date: "2025-06-25",
      time: "9:00 AM",
      duration: 150,
      type: "mixed",
      questionCount: 40,
      status: "ongoing",
    },
  ]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "objective":
        return "bg-blue-100 text-blue-800";
      case "theory":
        return "bg-purple-100 text-purple-800";
      case "mixed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Exams</h1>
          <p className="text-[#5A7A9A] text-sm">Create and manage examinations</p>
        </div>
        <Link
          href="/admin/exams/create"
          className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Exam
        </Link>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-[#1A3A5C]">{exam.title}</h3>
                <p className="text-sm text-[#4A6A8A]">
                  {exam.subject} • {exam.class}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(exam.status)}`}>
                {exam.status}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-sm text-[#5A7A9A]">
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {exam.date} at {exam.time}
              </p>
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {exam.duration} minutes
              </p>
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {exam.type} • {exam.questionCount} questions
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8EEF5] flex gap-2">
              <Link
                href={`/admin/exams/${exam.id}/edit`}
                className="flex-1 text-center bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-1.5 px-3 rounded-lg transition text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
                Edit
              </Link>
              <Link
                href={`/admin/exams/${exam.id}/questions`}
                className="flex-1 text-center bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-1.5 px-3 rounded-lg transition text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
                Questions
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamsPage;
