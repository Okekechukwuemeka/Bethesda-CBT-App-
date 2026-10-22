"use client";

import React from "react";
import { useParams } from "next/navigation";
import ExamStudentsPage from "@/components/admin/results/ExamStudentsPage";

const TeacherExamStudentsPage: React.FC = () => {
  const params = useParams<{ className: string; examId: string }>();
  const className = decodeURIComponent(params.className);

  return (
    <ExamStudentsPage
      role="staff"
      className={className}
      examId={params.examId}
      backHref={`/staff/results/${encodeURIComponent(className)}`}
    />
  );
};

export default TeacherExamStudentsPage;
