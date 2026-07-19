"use client";

import React from "react";
import ResultsFilters from "@/components/admin/results/ResultsFilters";
import ResultsGrid from "@/components/admin/results/ResultsGrid";
import { useResults } from "@/hooks/useResults";

const ResultsPage: React.FC = () => {
  const { filteredClasses, isLoading, error, searchTerm, setSearchTerm } = useResults();

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
        filteredCount={filteredClasses.length}
        onSearchChange={setSearchTerm}
      />

      {isLoading ? (
        <p className="text-center text-[#5A7A9A] py-12">Loading results...</p>
      ) : error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {error}
        </div>
      ) : (
        <ResultsGrid classes={filteredClasses} />
      )}
    </div>
  );
};

export default ResultsPage;
