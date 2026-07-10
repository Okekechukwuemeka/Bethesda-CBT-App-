"use client";

import { useState, useMemo, useCallback } from "react";

interface ClassResult {
  id: number;
  className: string;
  studentCount: number;
  completedExams: number;
  averageScore: number;
  performance: "excellent" | "good" | "average" | "poor";
}

const initialClasses: ClassResult[] = [
  {
    id: 1,
    className: "JSS1",
    studentCount: 45,
    completedExams: 6,
    averageScore: 72,
    performance: "good",
  },
  {
    id: 2,
    className: "JSS2",
    studentCount: 38,
    completedExams: 8,
    averageScore: 68,
    performance: "average",
  },
  {
    id: 3,
    className: "JSS3",
    studentCount: 52,
    completedExams: 10,
    averageScore: 78,
    performance: "excellent",
  },
  {
    id: 4,
    className: "SS1",
    studentCount: 30,
    completedExams: 5,
    averageScore: 65,
    performance: "average",
  },
  {
    id: 5,
    className: "SS2",
    studentCount: 28,
    completedExams: 7,
    averageScore: 70,
    performance: "good",
  },
  {
    id: 6,
    className: "SS3",
    studentCount: 25,
    completedExams: 9,
    averageScore: 82,
    performance: "excellent",
  },
];

export const useResults = () => {
  const [classes] = useState<ClassResult[]>(initialClasses);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPerformance, setFilterPerformance] = useState<string>("all");

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesSearch = cls.className.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPerformance =
        filterPerformance === "all" || cls.performance === filterPerformance;
      return matchesSearch && matchesPerformance;
    });
  }, [classes, searchTerm, filterPerformance]);

  return {
    classes,
    filteredClasses,
    searchTerm,
    filterPerformance,
    setSearchTerm,
    setFilterPerformance,
  };
};
