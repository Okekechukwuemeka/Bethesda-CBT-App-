"use client";

import React from "react";
import ResultsFilters from "@/components/admin/results/ResultsFilters";
import ResultsGrid from "@/components/admin/results/ResultsGrid";
import { useResults } from "@/hooks/useResults";

const ResultsPage: React.FC = () => {
  const { filteredClasses, searchTerm, filterPerformance, setSearchTerm, setFilterPerformance } =
    useResults();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Results</h1>
          <p className="text-[#5A7A9A] text-sm">View and manage student results by class</p>
        </div>
      </div>

      {/* Filters */}
      <ResultsFilters
        searchTerm={searchTerm}
        filterPerformance={filterPerformance}
        filteredCount={filteredClasses.length}
        onSearchChange={setSearchTerm}
        onPerformanceChange={setFilterPerformance}
      />

      {/* Results Grid */}
      <ResultsGrid classes={filteredClasses} />
    </div>
  );
};

export default ResultsPage;
