"use client";

import React from "react";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useModalFocusTrap } from "@/hooks/useModalFocusTrap";
import QuestionBankFilters from "@/components/admin/questions/QuestionBankFilters";
import QuestionBankTable from "@/components/admin/questions/QuestionBankTable";
import QuestionFormModal from "@/components/admin/questions/QuestionFormModal";
import BulkImportModal from "@/components/admin/questions/BulkImportModal";

const QuestionsPage: React.FC = () => {
  const {
    filteredQuestions,
    isModalOpen,
    isEditing,
    formData,
    formError,
    isSubmitting,
    statusMessage,
    searchTerm,
    filterSubject,
    filterType,
    isImportModalOpen,
    isImporting,
    importPreview,
    selectedFileName,
    formTriggerRef,
    importTriggerRef,
    setSearchTerm,
    setFilterSubject,
    setFilterType,
    handleInputChange,
    handleOptionChange,
    handleAddQuestion,
    handleEditQuestion,
    handleDeleteQuestion,
    handleSubmit,
    closeFormModal,
    handleOpenImportModal,
    closeImportModal,
    handleFileUpload,
    confirmImport,
    downloadTemplate,
  } = useQuestionBank();

  const formModalRef = React.useRef<HTMLDivElement>(null);
  const importModalRef = React.useRef<HTMLDivElement>(null);

  useModalFocusTrap(isModalOpen, formModalRef, formTriggerRef, closeFormModal, !isSubmitting);
  useModalFocusTrap(
    isImportModalOpen,
    importModalRef,
    importTriggerRef,
    closeImportModal,
    !isImporting,
  );

  const anyModalOpen = isModalOpen || isImportModalOpen;

  return (
    <>
      <div className="space-y-6" inert={anyModalOpen ? ("" as unknown as true) : undefined}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A3A5C]">Question Bank</h1>
            <p className="text-[#5A7A9A] text-sm">Create and manage questions for all exams</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOpenImportModal}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50 flex items-center gap-2">
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import Bulk
            </button>
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

        {/* Status Message */}
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

        {/* Filters */}
        <QuestionBankFilters
          searchTerm={searchTerm}
          filterSubject={filterSubject}
          filterType={filterType}
          filteredCount={filteredQuestions.length}
          onSearchChange={setSearchTerm}
          onSubjectChange={setFilterSubject}
          onTypeChange={setFilterType}
        />

        {/* Questions Table */}
        <QuestionBankTable
          questions={filteredQuestions}
          onEdit={handleEditQuestion}
          onDelete={handleDeleteQuestion}
        />
      </div>

      {/* Question Form Modal */}
      <QuestionFormModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        formData={formData}
        formError={formError}
        isSubmitting={isSubmitting}
        onChange={handleInputChange}
        onOptionChange={handleOptionChange}
        onSubmit={handleSubmit}
        onCancel={closeFormModal}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        isImporting={isImporting}
        importPreview={importPreview}
        selectedFileName={selectedFileName}
        onFileUpload={handleFileUpload}
        onConfirmImport={confirmImport}
        onDownloadTemplate={downloadTemplate}
        onCancel={closeImportModal}
      />
    </>
  );
};

export default QuestionsPage;
