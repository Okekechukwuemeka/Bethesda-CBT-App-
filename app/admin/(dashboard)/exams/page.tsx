"use client";

import React from "react";
import PageHeader from "@/components/admin/PageHeader";
import ExamsList from "@/components/admin/ExamsList";
import PlusIcon from "@/components/icons/PlusIcon";
import { useExams } from "@/hooks/useExams";

const ExamsPage: React.FC = () => {
  const { exams, isLoading, error } = useExams();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        description="Create and manage examinations"
        actions={[
          {
            label: "Create Exam",
            href: "/admin/exams/create",
            icon: <PlusIcon />,
            variant: "primary",
          },
        ]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A3A5C]" />
        </div>
      ) : (
        <ExamsList exams={exams} />
      )}
    </div>
  );
};

export default ExamsPage;
