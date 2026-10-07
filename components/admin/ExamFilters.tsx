import React from "react";
import { CLASS_LEVELS, EXAM_STATUSES, TERMS } from "@/lib/models/constants";
import type { ExamFilterValues } from "@/hooks/useExams";

interface SubjectOption {
  _id: string;
  name: string;
}

interface ExamFiltersProps {
  filters: ExamFilterValues;
  subjects: SubjectOption[];
  isLoadingSubjects: boolean;
  totalCount: number;
  hasActiveFilters: boolean;
  onChange: <K extends keyof ExamFilterValues>(key: K, value: ExamFilterValues[K]) => void;
  onClear: () => void;
}

const fieldClass =
  "w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60";
const labelClass = "block text-xs font-medium text-[#5A7A9A] mb-1";

const ExamFilters: React.FC<ExamFiltersProps> = ({
  filters,
  subjects,
  isLoadingSubjects,
  totalCount,
  hasActiveFilters,
  onChange,
  onClear,
}) => {
  return (
    <section
      aria-label="Filter exams"
      role="search"
      className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm space-y-4">
      <div>
        <label htmlFor="exam-search" className={labelClass}>
          Search
        </label>
        <input
          id="exam-search"
          type="search"
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
          placeholder="Search by exam title, subject or exam code..."
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label htmlFor="exam-filter-class" className={labelClass}>
            Class
          </label>
          <select
            id="exam-filter-class"
            value={filters.class}
            onChange={(e) => onChange("class", e.target.value)}
            className={fieldClass}>
            <option value="">All classes</option>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="exam-filter-subject" className={labelClass}>
            Subject
          </label>
          <select
            id="exam-filter-subject"
            value={filters.subject}
            onChange={(e) => onChange("subject", e.target.value)}
            disabled={isLoadingSubjects}
            className={fieldClass}>
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="exam-filter-term" className={labelClass}>
            Term
          </label>
          <select
            id="exam-filter-term"
            value={filters.term}
            onChange={(e) => onChange("term", e.target.value)}
            className={fieldClass}>
            <option value="">All terms</option>
            {TERMS.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="exam-filter-status" className={labelClass}>
            Status
          </label>
          <select
            id="exam-filter-status"
            value={filters.status}
            onChange={(e) => onChange("status", e.target.value)}
            className={fieldClass}>
            <option value="">All statuses</option>
            {EXAM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="sm:w-48">
          <label htmlFor="exam-filter-from" className={labelClass}>
            Exam date from
          </label>
          <input
            id="exam-filter-from"
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            onChange={(e) => onChange("dateFrom", e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="exam-filter-to" className={labelClass}>
            Exam date to
          </label>
          <input
            id="exam-filter-to"
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={(e) => onChange("dateTo", e.target.value)}
            className={fieldClass}
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 border border-[#2B6CB0] text-[#2B6CB0] hover:bg-[#F0F6FC] font-medium rounded-lg transition focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
            Clear filters
          </button>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {totalCount} exam{totalCount !== 1 ? "s" : ""} found
      </p>
    </section>
  );
};

export default ExamFilters;
