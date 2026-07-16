"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ClassResult } from "@/types/admin-results";

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error || fallback;
}

export const useResults = () => {
  const [classes, setClasses] = useState<ClassResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPerformance, setFilterPerformance] = useState<string>("all");

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/results/classes");
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load results"));
      const { classes: data } = await res.json();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesSearch = cls.className.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPerformance =
        filterPerformance === "all" ||
        cls.performance?.toLowerCase() === filterPerformance.toLowerCase();

      return matchesSearch && matchesPerformance;
    });
  }, [classes, searchTerm, filterPerformance]);

  return {
    classes,
    filteredClasses,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filterPerformance,
    setFilterPerformance,
    refreshClasses: fetchClasses,
  };
};
