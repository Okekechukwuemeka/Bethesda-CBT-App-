import React from "react";
import type { SubjectResult } from "@/types/admin-results";

interface StatsSummaryProps {
  subjects: SubjectResult[];
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ subjects }) => {
  const completedCount = subjects.filter((s) => s.status === "completed").length;
  const pendingCount = subjects.filter((s) => s.status === "pending").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm"
        role="group"
        aria-label={`Total subjects: ${subjects.length}`}>
        <p className="text-sm text-[#5A7A9A]">Total Subjects</p>
        <p className="text-2xl font-bold text-[#1A3A5C]">{subjects.length}</p>
      </div>
      <div
        className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm"
        role="group"
        aria-label={`Completed: ${completedCount}`}>
        <p className="text-sm text-[#5A7A9A]">Completed</p>
        <p className="text-2xl font-bold text-green-600">{completedCount}</p>
      </div>
      <div
        className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm"
        role="group"
        aria-label={`Pending: ${pendingCount}`}>
        <p className="text-sm text-[#5A7A9A]">Pending</p>
        <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
      </div>
    </div>
  );
};

export default StatsSummary;
