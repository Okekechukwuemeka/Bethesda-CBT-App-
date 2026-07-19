import React from "react";
import Link from "next/link";
import type { ClassResult } from "@/types/admin-results";

interface ClassResultCardProps {
  classResult: ClassResult;
}

const ClassResultCard: React.FC<ClassResultCardProps> = ({ classResult }) => {
  return (
    <li>
      <Link
        href={`/admin/results/${encodeURIComponent(classResult.className)}`}
        aria-label={`View results for ${classResult.className}: ${classResult.studentCount} students, ${classResult.totalExams} exams`}
        className="block bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm hover:shadow-md transition-all hover:border-[#2B6CB0] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] group">
        <h2 className="text-lg font-semibold text-[#1A3A5C]">{classResult.className}</h2>
        <p className="text-sm text-[#4A6A8A] mt-1">{classResult.studentCount} students</p>

        <div className="mt-4 pt-4 border-t border-[#E8EEF5] flex items-center justify-between">
          <span className="text-sm text-[#5A7A9A]">Exams</span>
          <span className="text-2xl font-bold text-[#1A3A5C]">{classResult.totalExams}</span>
        </div>

        <div className="mt-4 flex items-center justify-end text-sm text-[#2B6CB0] group-hover:text-[#1A3A5C] transition">
          <span>
            View Results <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </li>
  );
};

export default ClassResultCard;
