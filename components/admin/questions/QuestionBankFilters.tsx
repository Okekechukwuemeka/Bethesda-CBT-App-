import React, { useState, useEffect } from "react";

interface QuestionBankFiltersProps {
  searchTerm: string;
  filterSubject: string;
  filterType: string;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}

const QuestionBankFilters: React.FC<QuestionBankFiltersProps> = ({
  searchTerm,
  filterSubject,
  filterType,
  filteredCount,
  onSearchChange,
  onSubjectChange,
  onTypeChange,
}) => {
  const [announcedCount, setAnnouncedCount] = useState(filteredCount);

  useEffect(() => {
    const timer = setTimeout(() => setAnnouncedCount(filteredCount), 500);
    return () => clearTimeout(timer);
  }, [filteredCount]);

  return (
    <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm" role="search">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search questions
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by question or subject..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]"
            aria-label="Filter by subject">
            <option value="all">All Subjects</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Physics">Physics</option>
            <option value="Mathematics">Mathematics</option>
            <option value="English Language">English Language</option>
            <option value="Biology">Biology</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]"
            aria-label="Filter by type">
            <option value="all">All Types</option>
            <option value="objective">Objective</option>
            <option value="theory">Theory</option>
          </select>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcedCount} question{announcedCount !== 1 ? "s" : ""} found
      </p>
    </div>
  );
};

export default QuestionBankFilters;
