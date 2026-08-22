"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { ClassResult } from "@/types/admin-results";

const TeacherResultsPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/results/classes");
        if (!res.ok) throw new Error("Failed to load your classes");
        const { classes } = await res.json();
        setClasses(classes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your classes.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A5C]">Results</h1>
        <p className="text-[#5A7A9A] text-sm">View results for your assigned classes</p>
      </div>

      {isLoading ? (
        <p role="status" aria-live="polite" className="text-center text-[#5A7A9A] py-12">
          Loading your classes…
        </p>
      ) : error ? (
        <div role="alert" className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {error}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-12 text-center">
          <p className="text-[#5A7A9A] font-medium">
            No results yet — you'll see classes here once exams exist for your assigned subjects.
          </p>
        </div>
      ) : (
        <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <li key={c.className}>
              <Link
                href={`/staff/results/${encodeURIComponent(c.className)}`}
                aria-label={`View results for ${c.className}: ${c.studentCount} students, ${c.totalExams} exams`}
                className="block bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm hover:shadow-md transition-all hover:border-[#2B6CB0] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] group">
                <h2 className="text-lg font-semibold text-[#1A3A5C]">{c.className}</h2>
                <p className="text-sm text-[#4A6A8A] mt-1">{c.studentCount} students</p>
                <div className="mt-4 pt-4 border-t border-[#E8EEF5] flex items-center justify-between">
                  <span className="text-sm text-[#5A7A9A]">Exams</span>
                  <span className="text-2xl font-bold text-[#1A3A5C]">{c.totalExams}</span>
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
      )}
    </div>
  );
};

export default TeacherResultsPage;
