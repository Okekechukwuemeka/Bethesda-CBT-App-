import React, { useState, useEffect } from "react";
import type { Subject } from "@/types/question";
import { CLASS_LEVELS } from "@/lib/models/constants";

interface QuestionBankFiltersProps {
  searchTerm: string;
  filterSubject: string;
  filterType: string;
  filterClass: string;
  filteredCount?: number;
  subjects?: Subject[];
  isLoadingSubjects?: boolean;
  onSearchChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onAddSubject?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const QuestionBankFilters: React.FC<QuestionBankFiltersProps> = ({
  searchTerm,
  filterSubject,
  filterType,
  filterClass,
  filteredCount,
  subjects = [],
  isLoadingSubjects = false,
  onSearchChange,
  onSubjectChange,
  onTypeChange,
  onClassChange,
  onAddSubject,
}) => {
  const [announcedCount, setAnnouncedCount] = useState(filteredCount);

  useEffect(() => {
    const timer = setTimeout(() => setAnnouncedCount(filteredCount), 500);
    return () => clearTimeout(timer);
  }, [filteredCount]);

  return (
    <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm" role="search">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search questions
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by question text..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="filter-subject" className="sr-only">
              Filter by subject
            </label>
            <select
              id="filter-subject"
              value={filterSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              disabled={isLoadingSubjects}
              className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60">
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-class" className="sr-only">
              Filter by class
            </label>
            <select
              id="filter-class"
              value={filterClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
              <option value="all">All Classes</option>
              {CLASS_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-type" className="sr-only">
              Filter by type
            </label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
              <option value="all">All Types</option>
              <option value="Objective">Objective</option>
              <option value="Theory">Theory</option>
            </select>
          </div>
          {onAddSubject && (
            <button
              type="button"
              onClick={onAddSubject}
              className="px-4 py-2 border border-[#2B6CB0] text-[#2B6CB0] hover:bg-[#F0F6FC] font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Subject
            </button>
          )}
        </div>
      </div>
      {filteredCount !== undefined && (
        <p className="sr-only" role="status" aria-live="polite">
          {announcedCount} question{announcedCount !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
};

export default QuestionBankFilters;
