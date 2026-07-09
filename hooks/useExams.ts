"use client";

import { useState, useCallback } from "react";
import { Exam } from "@/types/exam";

const initialExams: Exam[] = [
  {
    id: 1,
    title: "Chemistry First Term Examination",
    subject: "Chemistry",
    class: "JSS3",
    term: "First Term",
    date: "2025-06-23",
    time: "7:00 AM",
    duration: 120,
    type: "objective",
    questionCount: 50,
    status: "scheduled",
  },
  {
    id: 2,
    title: "Physics First Term Examination",
    subject: "Physics",
    class: "JSS3",
    term: "First Term",
    date: "2025-06-27",
    time: "7:00 AM",
    duration: 120,
    type: "theory",
    questionCount: 5,
    status: "scheduled",
  },
  {
    id: 3,
    title: "Mathematics First Term Examination",
    subject: "Mathematics",
    class: "JSS3",
    term: "First Term",
    date: "2025-06-25",
    time: "9:00 AM",
    duration: 150,
    type: "mixed",
    questionCount: 40,
    status: "ongoing",
  },
];

export const useExams = () => {
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with API calls
  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // const response = await fetch('/api/admin/exams');
      // const data = await response.json();
      // setExams(data);
    } catch (err) {
      setError("Failed to fetch exams");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteExam = useCallback(async (examId: number) => {
    // TODO: Implement API call
    setExams((prev) => prev.filter((exam) => exam.id !== examId));
  }, []);

  return {
    exams,
    isLoading,
    error,
    fetchExams,
    deleteExam,
  };
};
