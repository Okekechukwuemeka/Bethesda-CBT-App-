import React, { useState, useEffect } from "react";

interface ResultsFiltersProps {
  searchTerm: string;
  filteredCount: number;
  onSearchChange: (value: string) => void;
}

const ResultsFilters: React.FC<ResultsFiltersProps> = ({
  searchTerm,
  filteredCount,
  onSearchChange,
}) => {
  const [announcedCount, setAnnouncedCount] = useState(filteredCount);

  useEffect(() => {
    const timer = setTimeout(() => setAnnouncedCount(filteredCount), 500);
    return () => clearTimeout(timer);
  }, [filteredCount]);

  return (
    <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm" role="search">
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
      <p className="sr-only" role="status" aria-live="polite">
        {announcedCount} class{announcedCount !== 1 ? "es" : ""} found
      </p>
    </div>
  );
};

export default ResultsFilters;
