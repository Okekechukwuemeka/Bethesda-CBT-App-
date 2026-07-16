import React from "react";
import type { ClassResult } from "@/types/admin-results";
import ClassResultCard from "./ClassResultCard";

interface ResultsGridProps {
  classes: ClassResult[];
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ classes }) => {
  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#C5D8EC] p-12 text-center">
        <div className="text-6xl mb-4" aria-hidden="true">
          📊
        </div>
        <p className="text-[#5A7A9A] font-medium">No classes found</p>
        <p className="text-sm text-[#8A9CAE]">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {classes.map((classResult) => (
        <ClassResultCard key={classResult.className} classResult={classResult} />
      ))}
    </ul>
  );
};

export default ResultsGrid;
