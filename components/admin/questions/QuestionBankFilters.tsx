import React, { useState, useEffect } from "react";
import type { Subject } from "@/types/question";
import { CLASS_LEVELS } from "@/lib/models/constants";
import type { QuestionGroupSummary } from "@/types/question";
import GroupFilterSelect from "@/components/questions/GroupFilterSelect";

interface QuestionBankFiltersProps {
  searchTerm: string;
  filterSubject: string;
  filterType: string;
  filterClass: string;
  filteredCount?: number;
  // Question group filter ("all" = no filter, "__ungrouped__" = no group).
  filterGroup?: string;
  groups?: QuestionGroupSummary[];
  ungroupedCount?: number;
  totalQuestions?: number;
  isLoadingGroups?: boolean;
  onGroupChange?: (value: string) => void;
  subjects?: Subject[];
  isLoadingSubjects?: boolean;
  onSearchChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onAddSubject?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  // Puts every filter and the search back to "everything".
  onClear?: () => void;
}

const labelClass = "block text-sm font-medium text-[#1A3A5C] mb-1";
const fieldClass =
  "w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60";

const QuestionBankFilters: React.FC<QuestionBankFiltersProps> = ({
  searchTerm,
  filterSubject,
  filterType,
  filterClass,
  filteredCount,
  filterGroup = "all",
  groups = [],
  ungroupedCount = 0,
  totalQuestions,
  isLoadingGroups = false,
  onGroupChange,
  subjects = [],
  isLoadingSubjects = false,
  onSearchChange,
  onSubjectChange,
  onTypeChange,
  onClassChange,
  onAddSubject,
  onClear,
}) => {
  const [announcedCount, setAnnouncedCount] = useState(filteredCount);

  useEffect(() => {
    const timer = setTimeout(() => setAnnouncedCount(filteredCount), 500);
    return () => clearTimeout(timer);
  }, [filteredCount]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    filterSubject !== "all" ||
    filterType !== "all" ||
    filterClass !== "all" ||
    filterGroup !== "all";

  return (
    <section
      aria-label="Search and filter questions"
      role="search"
      className="bg-white rounded-xl border border-[#C5D8EC] p-5 shadow-sm space-y-4">
      {/* Search gets a full row of its own so it can never be squeezed */}
      <div>
        <label htmlFor="search" className={labelClass}>
          Search questions
        </label>
        <input
          id="search"
          type="search"
          placeholder="Type part of a question to find it…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${fieldClass} px-4`}
        />
      </div>

      {/* Four equal filters in one tidy grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {onGroupChange && (
          <GroupFilterSelect
            id="filter-group"
            value={filterGroup}
            onChange={onGroupChange}
            groups={groups}
            ungroupedCount={ungroupedCount}
            totalCount={totalQuestions}
            isLoading={isLoadingGroups}
            allValue="all"
          />
        )}
        <div>
          <label htmlFor="filter-subject" className={labelClass}>
            Subject
          </label>
          <select
            id="filter-subject"
            value={filterSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            disabled={isLoadingSubjects}
            className={fieldClass}>
            <option value="all">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-class" className={labelClass}>
            Class
          </label>
          <select
            id="filter-class"
            value={filterClass}
            onChange={(e) => onClassChange(e.target.value)}
            className={fieldClass}>
            <option value="all">All classes</option>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-type" className={labelClass}>
            Question type
          </label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => onTypeChange(e.target.value)}
            className={fieldClass}>
            <option value="all">All types</option>
            <option value="Objective">Objective</option>
            <option value="Theory">Theory</option>
          </select>
        </div>
      </div>

      {(onAddSubject || (hasActiveFilters && onClear)) && (
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#E8EEF5]">
          {hasActiveFilters && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 mt-3 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] text-sm font-medium rounded-lg transition focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
              Clear search and filters
            </button>
          )}
          {onAddSubject && (
            <button
              type="button"
              onClick={onAddSubject}
              className="px-4 py-2 mt-3 border border-[#2B6CB0] text-[#2B6CB0] hover:bg-[#F0F6FC] text-sm font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 flex items-center gap-2 sm:ml-auto">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Subject
            </button>
          )}
        </div>
      )}

      {filteredCount !== undefined && (
        <p className="sr-only" role="status" aria-live="polite">
          {announcedCount} question{announcedCount !== 1 ? "s" : ""} found
        </p>
      )}
    </section>
  );
};

export default QuestionBankFilters;
