import React, { useState, useEffect } from "react";

interface ResultsFiltersProps {
  searchTerm: string;
  filterPerformance: string;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onPerformanceChange: (value: string) => void;
}

const ResultsFilters: React.FC<ResultsFiltersProps> = ({
  searchTerm,
  filterPerformance,
  filteredCount,
  onSearchChange,
  onPerformanceChange,
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
            Search classes
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by class name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
          />
        </div>
        <div>
          <label htmlFor="filterPerformance" className="sr-only">
            Filter by performance
          </label>
          <select
            id="filterPerformance"
            value={filterPerformance}
            onChange={(e) => onPerformanceChange(e.target.value)}
            className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
            <option value="all">All Performance</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="average">Average</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcedCount} class{announcedCount !== 1 ? "es" : ""} found
      </p>
    </div>
  );
};

export default ResultsFilters;
