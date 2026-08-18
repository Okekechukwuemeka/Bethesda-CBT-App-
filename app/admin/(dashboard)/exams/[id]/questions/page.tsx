"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QuestionFilters from "@/components/admin/questions/QuestionFilters";
import QuestionsTable from "@/components/admin/questions/QuestionsTable";
import QuestionFormModal from "@/components/admin/questions/QuestionFormModal";
import QuestionBank from "@/components/questions/QuestionBank";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useExamQuestions } from "@/hooks/useExamQuestions";
import type { BankQuestion as SharedBankQuestion } from "@/types/exam.types";

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
    handleAddOption,
    handleRemoveOption,
    handleAddQuestion,
    handleEditQuestion,
    requestDeleteQuestion,
    cancelDeleteQuestion,
    confirmDeleteQuestion,
    handleSubmit,
    closeModal,

    // bank browsing/attach
    showQuestionBank,
    setShowQuestionBank,
    bankQuestions,
    isLoadingBank,
    bankSearchTerm,
    setBankSearchTerm,
    bankFilterType,
    setBankFilterType,
    bankFilterSubject,
    setBankFilterSubject,
    bankFilterClass,
    setBankFilterClass,
    attachedIds,
    handleAttachBankQuestion,

    // passage picker (inside the question form)
    passages,
    isLoadingPassages,
    newPassageData,
    handleNewPassageChange,
  } = useExamQuestions(examId);

  const subjectName =
    exam?.subject && typeof exam.subject === "object" ? exam.subject.name : exam?.subject;

  // QuestionBank.tsx (and its children) were built against a DIFFERENT
  // BankQuestion type (types/exam.types.ts, keyed by "id") than the one
  // this hook returns (keyed by "_id"). Rather than reconciling the two
  // types everywhere, adapt at this one boundary: convert hook shape ->
  // component shape going in, and go the other way for the callback.
  const bankQuestionsForComponent: SharedBankQuestion[] = bankQuestions.map((q) => ({
    id: q._id,
    text: q.text,
    type: q.type,
    subject: typeof q.subject === "string" ? q.subject : q.subject.name,
    class: q.class,
    marks: q.marks,
    options: q.options,
    correctAnswer: q.correctAnswer,
    passage:
      q.passageId && typeof q.passageId === "object"
        ? { id: q.passageId._id, title: q.passageId.title }
        : undefined,
    passageOrder: q.passageOrder,
  }));

  const selectedQuestionsForComponent: SharedBankQuestion[] = filteredQuestions
    .filter((q) => attachedIds.has(q._id))
    .map((q) => ({
      id: q._id,
      text: q.text,
      type: q.type,
      subject: typeof q.subject === "string" ? q.subject : q.subject.name,
      class: q.class,
      marks: q.marks,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

  const handleAddFromBank = (question: SharedBankQuestion) => {
    // Map back to the hook's _id-keyed shape it actually expects. The
    // component only round-trips fields it received, so `id` maps
    // straight back to the original `_id`.
    const original = bankQuestions.find((q) => q._id === question.id);
    if (original) handleAttachBankQuestion(original);
  };

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
                  {exam.isGeneral
                    ? ` • General${exam.classes?.length ? ` (${exam.classes.join(", ")})` : ""}`
                    : exam.class && ` • ${exam.class}`}
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

        <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm">
          <QuestionBank
            isOpen={showQuestionBank}
            onToggle={() => setShowQuestionBank(!showQuestionBank)}
            questions={bankQuestionsForComponent}
            selectedQuestions={selectedQuestionsForComponent}
            subjects={subjects.map((s) => ({ id: s._id, name: s.name }))}
            isLoadingBank={isLoadingBank}
            searchTerm={bankSearchTerm}
            filterType={bankFilterType}
            filterSubject={bankFilterSubject}
            filterClass={bankFilterClass}
            onSearchChange={setBankSearchTerm}
            onTypeChange={setBankFilterType}
            onSubjectChange={setBankFilterSubject}
            onClassChange={setBankFilterClass}
            onAddQuestion={handleAddFromBank}
          />
        </div>

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
        isEditing={isEditing}
        formData={formData}
        formError={formError}
        isSubmitting={isSubmitting}
        subjects={subjects}
        isLoadingSubjects={isLoadingSubjects}
        passages={passages}
        isLoadingPassages={isLoadingPassages}
        newPassageData={newPassageData}
        onChange={handleInputChange}
        onNewPassageChange={handleNewPassageChange}
        onOptionChange={handleOptionChange}
        onAddOption={handleAddOption}
        onRemoveOption={handleRemoveOption}
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
