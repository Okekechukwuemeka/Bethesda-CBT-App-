import React from "react";
import { Exam } from "@/types/exam.types";
import EmptyState from "./EmptyState";
import ExamGrid from "./ExamGrid";

interface ExamsListProps {
  exams: Exam[];
  onDelete: (exam: Exam) => void;
  // True when the empty result is because of the filters/search rather than
  // there being no exams at all.
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

const ExamsList: React.FC<ExamsListProps> = ({
  exams,
  onDelete,
  hasActiveFilters = false,
  onClearFilters,
}) => {
  if (exams.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-12 text-center">
          <p className="text-[#5A7A9A]">No exams match your search or filters.</p>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2 rounded-lg transition focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
              Clear filters
            </button>
          )}
        </div>
      );
    }
    return (
      <EmptyState
        message="No exams have been created yet."
        actionLabel="Create your first exam"
        actionHref="/admin/exams/create"
      />
    );
  }

  return <ExamGrid exams={exams} onDelete={onDelete} />;
};

export default ExamsList;
