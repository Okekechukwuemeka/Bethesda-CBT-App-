import React from "react";
import { Exam } from "@/types/exam.types";
import EmptyState from "./EmptyState";
import ExamGrid from "./ExamGrid";

interface ExamsListProps {
  exams: Exam[];
  onDelete: (exam: Exam) => void;
}

const ExamsList: React.FC<ExamsListProps> = ({ exams, onDelete }) => {
  // was missing onDelete here
  if (exams.length === 0) {
    return (
      <EmptyState
        message="No exams have been created yet."
        actionLabel="Create your first exam"
        actionHref="/admin/exams/create"
      />
    );
  }

  return <ExamGrid exams={exams} onDelete={onDelete} />;
};

export default ExamsList;
