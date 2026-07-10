import React from "react";
import Link from "next/link";
import PerformanceBadge from "./PerformanceBadge";
import ScoreBar from "./ScoreBar";

interface ClassResult {
  id: number;
  className: string;
  studentCount: number;
  completedExams: number;
  averageScore: number;
  performance: "excellent" | "good" | "average" | "poor";
}

interface ClassResultCardProps {
  classResult: ClassResult;
}

const ClassResultCard: React.FC<ClassResultCardProps> = ({ classResult }) => {
  return (
    <li>
      <Link
        href={`/admin/results/${classResult.className}`}
        aria-label={`View results for ${classResult.className}: ${classResult.studentCount} students, average score ${classResult.averageScore}%, ${classResult.performance} performance`}
        className="block bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm hover:shadow-md transition-all hover:border-[#2B6CB0] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] group">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1A3A5C]">{classResult.className}</h2>
            <p className="text-sm text-[#4A6A8A]">
              {classResult.studentCount} students &bull; {classResult.completedExams} exams
            </p>
          </div>
          <PerformanceBadge performance={classResult.performance} />
        </div>

        <div className="mt-4 pt-4 border-t border-[#E8EEF5]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#5A7A9A]">Average Score</span>
            <span className="text-2xl font-bold text-[#1A3A5C]">{classResult.averageScore}%</span>
          </div>
          <ScoreBar score={classResult.averageScore} />
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
