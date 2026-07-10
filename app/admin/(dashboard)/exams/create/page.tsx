// app/admin/exams/create/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import StatusMessage from "@/components/ui/StatusMessage";
import ScheduleSection from "@/components/admin/exam-form/ScheduleSection";
import ScoringSection from "@/components/admin/exam-form/ScoringSection";
import InstructionsSection from "@/components/admin/exam-form/InstructionsSection";
import QuestionsSection from "@/components/admin/exam-form/QuestionsSection";
import { useCreateExamWithQuestions } from "@/hooks/useCreateExamWithQuestions";
import SuccessStateWithQuestions from "@/components/admin/exam-form/SuccessStateWithQuestions";
import ExamDetailsSection from "@/components/admin/exam-form/ExamDetailsSection";

const BackIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const CreateExamPage: React.FC = () => {
  const {
    formData,
    isSubmitting,
    isSubmitted,
    statusMessage,
    fieldErrors,
    selectedQuestions,
    filteredQuestions,
    searchTerm,
    filterType,
    filterSubject,
    filterClass,
    showQuestionBank,
    totalMarks,
    titleInputRef,
    fieldRefs,
    handleInputChange,
    handleAddQuestion,
    handleRemoveQuestion,
    handleSubmit,
    resetForm,
    setSearchTerm,
    setFilterType,
    setFilterSubject,
    setFilterClass,
    setShowQuestionBank,
  } = useCreateExamWithQuestions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Exam"
        description="Create a new examination with questions"
        actions={[
          {
            label: "Back to Exams",
            href: "/admin/exams",
            icon: <BackIcon />,
            variant: "secondary",
          },
        ]}
      />

      {statusMessage && <StatusMessage type={statusMessage.type} text={statusMessage.text} />}

      <div className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm">
        {isSubmitted ? (
          <SuccessStateWithQuestions
            examTitle={formData.title}
            questionCount={selectedQuestions.length}
            totalMarks={totalMarks}
            onReset={resetForm}
          />
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <ExamDetailsSection
              formData={formData}
              fieldErrors={fieldErrors}
              fieldRefs={fieldRefs}
              titleInputRef={titleInputRef}
              onChange={handleInputChange}
            />

            <ScheduleSection
              formData={formData}
              fieldErrors={fieldErrors}
              fieldRefs={fieldRefs}
              onChange={handleInputChange}
            />

            <ScoringSection formData={formData} onChange={handleInputChange} />

            <InstructionsSection formData={formData} onChange={handleInputChange} />

            <QuestionsSection
              selectedQuestions={selectedQuestions}
              questionBank={filteredQuestions}
              filteredQuestions={filteredQuestions}
              searchTerm={searchTerm}
              filterType={filterType}
              filterSubject={filterSubject}
              filterClass={filterClass}
              showQuestionBank={showQuestionBank}
              onRemoveQuestion={handleRemoveQuestion}
              onSearchChange={setSearchTerm}
              onTypeChange={setFilterType}
              onSubjectChange={setFilterSubject}
              onClassChange={setFilterClass}
              onAddQuestion={handleAddQuestion}
              onToggleQuestionBank={() => setShowQuestionBank(!showQuestionBank)}
            />

            <div className="flex gap-3 pt-4 border-t border-[#E8EEF5]">
              <Link
                href="/admin/exams"
                className="flex-1 text-center bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isSubmitting ? "Creating exam, please wait" : "Create exam"}>
                {isSubmitting
                  ? "Creating..."
                  : `Create Exam (${selectedQuestions.length} questions)`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateExamPage;
