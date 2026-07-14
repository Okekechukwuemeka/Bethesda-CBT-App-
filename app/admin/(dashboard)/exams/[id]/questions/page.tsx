"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QuestionFilters from "@/components/admin/questions/QuestionFilters";
import QuestionsTable from "@/components/admin/questions/QuestionsTable";
import QuestionFormModal from "@/components/admin/questions/QuestionFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useExamQuestions } from "@/hooks/useExamQuestions";

const ExamQuestionsPage: React.FC = () => {
  const params = useParams();
  const examId = params?.id as string;

  const {
    exam,
    filteredQuestions,
    isLoadingQuestions,
    subjects,
    isLoadingSubjects,
    isModalOpen,
    isEditing,
    formData,
    formError,
    isSubmitting,
    statusMessage,
    searchTerm,
    filterType,
    totalMarks,
    questionPendingDelete,
    isDeleting,
    setSearchTerm,
    setFilterType,
    handleInputChange,
    handleOptionChange,
    handleAddQuestion,
    handleEditQuestion,
    requestDeleteQuestion,
    cancelDeleteQuestion,
    confirmDeleteQuestion,
    handleSubmit,
    closeModal,
  } = useExamQuestions(examId);

  const subjectName =
    exam?.subject && typeof exam.subject === "object" ? exam.subject.name : exam?.subject;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A3A5C]">Exam Questions</h1>
            <p className="text-[#5A7A9A] text-sm">
              {exam ? (
                <>
                  Managing questions for <strong>{exam.title}</strong>
                  {subjectName && ` • ${subjectName}`}
                  {exam.class && ` • ${exam.class}`}
                </>
              ) : (
                "Loading exam details…"
              )}{" "}
              &bull; Total Marks: {totalMarks}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/exams"
              className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </Link>
            <button
              onClick={handleAddQuestion}
              className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Question
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            role={statusMessage.type === "error" ? "alert" : "status"}
            aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
            className={`p-4 rounded-lg text-sm font-medium ${
              statusMessage.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : statusMessage.type === "warning"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-red-100 text-red-800 border border-red-300"
            }`}>
            {statusMessage.text}
          </div>
        )}

        <QuestionFilters
          searchTerm={searchTerm}
          filterType={filterType}
          onSearchChange={setSearchTerm}
          onTypeChange={setFilterType}
        />

        <QuestionsTable
          questions={filteredQuestions}
          isLoading={isLoadingQuestions}
          onEdit={handleEditQuestion}
          onDelete={requestDeleteQuestion}
        />
      </div>

      <QuestionFormModal
        isOpen={isModalOpen}
        idatesEditing={isEditing}
        formData={formData}
        formError={formError}
        isSubmitting={isSubmitting}
        subjects={subjects}
        isLoadingSubjects={isLoadingSubjects}
        onChange={handleInputChange}
        onOptionChange={handleOptionChange}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        isOpen={!!questionPendingDelete}
        title="Remove this question?"
        description={
          questionPendingDelete
            ? `This removes "${questionPendingDelete.text.substring(0, 60)}${
                questionPendingDelete.text.length > 60 ? "…" : ""
              }" from this exam only. It stays in the question bank and can be re-added later.`
            : ""
        }
        confirmLabel="Remove"
        isDangerous
        isProcessing={isDeleting}
        onConfirm={confirmDeleteQuestion}
        onCancel={cancelDeleteQuestion}
      />
    </>
  );
};

export default ExamQuestionsPage;
