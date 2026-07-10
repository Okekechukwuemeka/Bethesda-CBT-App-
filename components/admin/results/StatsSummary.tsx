import React from "react";

interface SubjectResult {
  id: number;
  subject: string;
  examType: "objective" | "theory" | "mixed";
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completed: number;
  status: "completed" | "pending" | "in-progress";
}

interface StatsSummaryProps {
  subjectResults: SubjectResult[];
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ subjectResults }) => {
  const completedCount = subjectResults.filter((s) => s.status === "completed").length;
  const pendingCount = subjectResults.filter((s) => s.status === "pending").length;
  const averageScore = Math.round(
    subjectResults.reduce((sum, s) => sum + s.averageScore, 0) / subjectResults.length,
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm"
        role="group"
        aria-label={`Total subjects: ${subjectResults.length}`}>
        <p className="text-sm text-[#5A7A9A]">Total Subjects</p>
        <p className="text-2xl font-bold text-[#1A3A5C]">{subjectResults.length}</p>
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
      <div
        className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm"
        role="group"
        aria-label={`Average score: ${averageScore}%`}>
        <p className="text-sm text-[#5A7A9A]">Average Score</p>
        <p className="text-2xl font-bold text-[#1A3A5C]">{averageScore}%</p>
      </div>
    </div>
  );
};

export default StatsSummary;
