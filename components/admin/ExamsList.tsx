// components/admin/ExamsList.tsx
import React from "react";
import { Exam } from "@/types/exam";
import ExamGrid from "./ExamGrid";
import EmptyState from "./EmptyState";

interface ExamsListProps {
  exams: Exam[];
}

const ExamsList: React.FC<ExamsListProps> = ({ exams }) => {
  if (exams.length === 0) {
    return (
      <EmptyState
        message="No exams have been created yet."
        actionLabel="Create your first exam"
        actionHref="/admin/exams/create"
      />
    );
  }

  return <ExamGrid exams={exams} />;
};

export default ExamsList;
