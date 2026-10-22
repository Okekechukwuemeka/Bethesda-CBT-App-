"use client";

import React from "react";
import { useParams } from "next/navigation";
import ExamStudentsPage from "@/components/admin/results/ExamStudentsPage";

const AdminExamStudentsPage: React.FC = () => {
  const params = useParams<{ className: string; examId: string }>();
  const className = decodeURIComponent(params.className);

  return (
    <ExamStudentsPage
      role="admin"
      className={className}
      examId={params.examId}
      backHref={`/admin/results/${encodeURIComponent(className)}`}
    />
  );
};

export default AdminExamStudentsPage;
