"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ClassResult {
  id: number;
  className: string;
  studentCount: number;
  completedExams: number;
  averageScore: number;
  performance: "excellent" | "good" | "average" | "poor";
}

const ResultsPage: React.FC = () => {
  const [classes] = useState<ClassResult[]>([
    {
      id: 1,
      className: "JSS1",
      studentCount: 45,
      completedExams: 6,
      averageScore: 72,
      performance: "good",
    },
    {
      id: 2,
      className: "JSS2",
      studentCount: 38,
      completedExams: 8,
      averageScore: 68,
      performance: "average",
    },
    {
      id: 3,
      className: "JSS3",
      studentCount: 52,
      completedExams: 10,
      averageScore: 78,
      performance: "excellent",
    },
    {
      id: 4,
      className: "SS1",
      studentCount: 30,
      completedExams: 5,
      averageScore: 65,
      performance: "average",
    },
    {
      id: 5,
      className: "SS2",
      studentCount: 28,
      completedExams: 7,
      averageScore: 70,
      performance: "good",
    },
    {
      id: 6,
      className: "SS3",
      studentCount: 25,
      completedExams: 9,
      averageScore: 82,
      performance: "excellent",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPerformance, setFilterPerformance] = useState<string>("all");

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "average":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceIcon = (performance: string) => {
    const iconProps = {
      className: "w-4 h-4",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      "aria-hidden": true as const,
      focusable: "false" as const,
    };
    switch (performance) {
      case "excellent":
        return (
          <svg {...iconProps}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "good":
        return (
          <svg {...iconProps}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "average":
        return (
          <svg {...iconProps}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "poor":
        return (
          <svg {...iconProps}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch = cls.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerformance = filterPerformance === "all" || cls.performance === filterPerformance;
    return matchesSearch && matchesPerformance;
  });

  // Debounced live-region announcement, consistent with the Question Bank page,
  // so rapid typing doesn't queue up an announcement per keystroke.
  const [announcedCount, setAnnouncedCount] = useState(filteredClasses.length);
  useEffect(() => {
    const timer = setTimeout(() => setAnnouncedCount(filteredClasses.length), 500);
    return () => clearTimeout(timer);
  }, [filteredClasses.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Results</h1>
          <p className="text-[#5A7A9A] text-sm">View and manage student results by class</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm" role="search">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search classes
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by class name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
            />
          </div>
          <div>
            <label htmlFor="filterPerformance" className="sr-only">
              Filter by performance
            </label>
            <select
              id="filterPerformance"
              value={filterPerformance}
              onChange={(e) => setFilterPerformance(e.target.value)}
              className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
              <option value="all">All Performance</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {announcedCount} class{announcedCount !== 1 ? "es" : ""} found
        </p>
      </div>

      {/* Classes Grid */}
      <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => (
          <li key={cls.id}>
            <Link
              href={`/admin/results/${cls.className}`}
              aria-label={`View results for ${cls.className}: ${cls.studentCount} students, average score ${cls.averageScore}%, ${cls.performance} performance`}
              className="block bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm hover:shadow-md transition-all hover:border-[#2B6CB0] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] group">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A3A5C]">{cls.className}</h2>
                  <p className="text-sm text-[#4A6A8A]">
                    {cls.studentCount} students &bull; {cls.completedExams} exams
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(cls.performance)}`}>
                  {getPerformanceIcon(cls.performance)}
                  <span className="capitalize">{cls.performance}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E8EEF5]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5A7A9A]">Average Score</span>
                  <span className="text-2xl font-bold text-[#1A3A5C]">{cls.averageScore}%</span>
                </div>
                {/* Purely decorative re-visualization of the score already shown as text
                    above and already included in the link's aria-label — hidden from AT
                    to avoid announcing the same percentage twice in two different forms. */}
                <div className="mt-2 w-full bg-[#E8EEF5] rounded-full h-2" aria-hidden="true">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      cls.averageScore >= 70
                        ? "bg-green-500"
                        : cls.averageScore >= 60
                          ? "bg-blue-500"
                          : cls.averageScore >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                    }`}
                    style={{ width: `${cls.averageScore}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end text-sm text-[#2B6CB0] group-hover:text-[#1A3A5C] transition">
                <span>
                  View Results <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {filteredClasses.length === 0 && (
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-12 text-center">
          <div className="text-6xl mb-4" aria-hidden="true">
            📊
          </div>
          <p className="text-[#5A7A9A] font-medium">No classes found</p>
          <p className="text-sm text-[#8A9CAE]">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
