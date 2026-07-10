import React, { useState, useEffect } from "react";

interface StudentFiltersProps {
  searchTerm: string;
  filterClass: string;
  filterStatus: string;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

const StudentFilters: React.FC<StudentFiltersProps> = ({
  searchTerm,
  filterClass,
  filterStatus,
  filteredCount,
  onSearchChange,
  onClassChange,
  onStatusChange,
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
            Search students
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by name, admission number, or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#5A6B7D]"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="filterClass" className="sr-only">
              Filter by class
            </label>
            <select
              id="filterClass"
              value={filterClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-[#1A1A1A]">
              <option value="all">All Classes</option>
              <option value="JSS1">JSS1</option>
              <option value="JSS2">JSS2</option>
              <option value="JSS3">JSS3</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterStatus" className="sr-only">
              Filter by status
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-[#1A1A1A]">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcedCount} student{announcedCount !== 1 ? "s" : ""} found
      </p>
    </div>
  );
};

export default StudentFilters;
