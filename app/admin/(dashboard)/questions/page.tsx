"use client";

import React from "react";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useModalFocusTrap } from "@/hooks/useModalFocusTrap";
import QuestionBankFilters from "@/components/admin/questions/QuestionBankFilters";
import QuestionBankTable from "@/components/admin/questions/QuestionBankTable";
import QuestionFormModal from "@/components/admin/questions/QuestionFormModal";
import BulkImportModal from "@/components/admin/questions/BulkImportModal";
import ConfirmDeleteModal from "@/components/admin/questions/ConfirmDeleteModal";
import SubjectFormModal from "@/components/admin/questions/SubjectFormModal";
import PassageManagerModal from "@/components/admin/questions/PassageManagerModal";

const QuestionsPage: React.FC = () => {
  const {
    questions,
    isLoadingQuestions,
    questionsError,
    subjects,
    isLoadingSubjects,
    filteredCount,

    searchTerm,
    filterSubject,
    filterType,
    filterClass,
    setSearchTerm,
    setFilterSubject,
    setFilterType,
    setFilterClass,

    statusMessage,

    isModalOpen,
    isEditing,
    formData,
    formError,
    isSubmitting,
    formTriggerRef,
    handleInputChange,
    handleOptionChange,
    handleAddQuestion,
    handleEditQuestion,
    handleSubmit,
    closeFormModal,

    pendingDelete,
    isDeleting,
    deleteError,
    deleteBlockedExams,
    deleteTriggerRef,
    handleDeleteQuestion,
    closeDeleteModal,
    confirmDelete,
    forceConfirmDelete,

    isImportModalOpen,
    isImporting,
    selectedFileName,
    previewRowCount,
    importSubject,
    importClass,
    importError,
    importRowErrors,
    importTriggerRef,
    setImportSubject,
    setImportClass,
    handleOpenImportModal,
    closeImportModal,
    handleFileUpload,
    confirmImport,
    downloadTemplate,

    isSubjectModalOpen,
    subjectName,
    subjectCode,
    subjectFormError,
    isSubmittingSubject,
    subjectTriggerRef,
    setSubjectName,
    setSubjectCode,
    handleOpenSubjectModal,
    closeSubjectModal,
    handleSubjectSubmit,
    handleAddOption,
    handleRemoveOption,

    // passage picker (inside the question form)
    passages,
    isLoadingPassages,
    newPassageData,
    handleNewPassageChange,

    // passage manager modal
    isPassageManagerOpen,
    passageManagerView,
    passagesError,
    passageManagerTriggerRef,
    openPassageManager,
    closePassageManager,
    startCreatePassage,
    startEditPassage,
    cancelPassageForm,
    editingPassage,
    passageFormData,
    passageFormError,
    isSavingPassage,
    handlePassageFormChange,
    submitPassageForm,
    pendingDeletePassage,
    isDeletingPassage,
    deletePassageError,
    deleteBlockedByQuestions,
    requestDeletePassage,
    cancelDeletePassage,
    confirmDeletePassage,
  } = useQuestionBank();

  const formModalRef = React.useRef<HTMLDivElement>(null);
  const importModalRef = React.useRef<HTMLDivElement>(null);
  const deleteModalRef = React.useRef<HTMLDivElement>(null);
  const subjectModalRef = React.useRef<HTMLDivElement>(null);

  useModalFocusTrap(isModalOpen, formModalRef, formTriggerRef, closeFormModal, !isSubmitting);
  useModalFocusTrap(
    isImportModalOpen,
    importModalRef,
    importTriggerRef,
    closeImportModal,
    !isImporting,
  );
  useModalFocusTrap(
    !!pendingDelete,
    deleteModalRef,
    deleteTriggerRef,
    closeDeleteModal,
    !isDeleting,
  );
  useModalFocusTrap(
    isSubjectModalOpen,
    subjectModalRef,
    subjectTriggerRef,
    closeSubjectModal,
    !isSubmittingSubject,
  );

  const anyModalOpen =
    isModalOpen ||
    isImportModalOpen ||
    !!pendingDelete ||
    isSubjectModalOpen ||
    isPassageManagerOpen;

  // Used both to show the passage-aware note in the delete confirmation
  // and, indirectly, wherever the currently-pending-delete question's
  // passage needs a human-readable label rather than just an id.
  const pendingDeletePassageLabel = pendingDelete?.passageId
    ? typeof pendingDelete.passageId === "string"
      ? null // id only, no populated title available - safe to omit the note rather than guess
      : pendingDelete.passageId.title || "Untitled passage"
    : null;

  return (
    <>
      <div className="space-y-6" inert={anyModalOpen}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A3A5C]">Question Bank</h1>
            <p className="text-[#5A7A9A] text-sm">Create and manage questions for all exams</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openPassageManager}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-500/50 flex items-center gap-2">
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Manage Passages
            </button>
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

        {/* Status Message (live region — not a blocking alert()) */}
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

        {questionsError && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
            {questionsError}
          </div>
        )}

        {/* Filters */}
        <QuestionBankFilters
          searchTerm={searchTerm}
          filterSubject={filterSubject}
          filterType={filterType}
          filterClass={filterClass}
          filteredCount={filteredCount}
          subjects={subjects}
          isLoadingSubjects={isLoadingSubjects}
          onSearchChange={setSearchTerm}
          onSubjectChange={setFilterSubject}
          onTypeChange={setFilterType}
          onClassChange={setFilterClass}
          onAddSubject={handleOpenSubjectModal}
        />

        {/* Questions Table */}
        <QuestionBankTable
          questions={questions}
          isLoading={isLoadingQuestions}
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
        subjects={subjects}
        isLoadingSubjects={isLoadingSubjects}
        passages={passages}
        isLoadingPassages={isLoadingPassages}
        newPassageData={newPassageData}
        onChange={handleInputChange}
        onNewPassageChange={handleNewPassageChange}
        onOptionChange={handleOptionChange}
        onSubmit={handleSubmit}
        onCancel={closeFormModal}
        onAddOption={handleAddOption}
        onRemoveOption={handleRemoveOption}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        isImporting={isImporting}
        selectedFileName={selectedFileName}
        previewRowCount={previewRowCount}
        subjects={subjects}
        isLoadingSubjects={isLoadingSubjects}
        importSubject={importSubject}
        importClass={importClass}
        importError={importError}
        importRowErrors={importRowErrors}
        onSubjectChange={setImportSubject}
        onClassChange={setImportClass}
        onFileUpload={handleFileUpload}
        onConfirmImport={confirmImport}
        onDownloadTemplate={downloadTemplate}
        onCancel={closeImportModal}
      />

      {/* Delete Confirmation Modal (replaces window.confirm) */}
      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        questionText={pendingDelete?.text ?? null}
        passageLabel={pendingDeletePassageLabel}
        isProcessing={isDeleting}
        error={deleteError}
        blockedByExams={deleteBlockedExams}
        onConfirm={confirmDelete}
        onForceConfirm={forceConfirmDelete}
        onCancel={closeDeleteModal}
      />

      {/* Add Subject Modal */}
      <SubjectFormModal
        isOpen={isSubjectModalOpen}
        name={subjectName}
        code={subjectCode}
        formError={subjectFormError}
        isSubmitting={isSubmittingSubject}
        onNameChange={setSubjectName}
        onCodeChange={setSubjectCode}
        onSubmit={handleSubjectSubmit}
        onCancel={closeSubjectModal}
      />

      {/* Manage Passages Modal */}
      <PassageManagerModal
        isOpen={isPassageManagerOpen}
        view={passageManagerView}
        passages={passages}
        isLoadingPassages={isLoadingPassages}
        passagesError={passagesError}
        subjects={subjects}
        isLoadingSubjects={isLoadingSubjects}
        editingPassage={editingPassage}
        passageFormData={passageFormData}
        passageFormError={passageFormError}
        isSavingPassage={isSavingPassage}
        onFormChange={handlePassageFormChange}
        onFormSubmit={submitPassageForm}
        onStartCreate={startCreatePassage}
        onStartEdit={startEditPassage}
        onCancelForm={cancelPassageForm}
        pendingDeletePassage={pendingDeletePassage}
        isDeletingPassage={isDeletingPassage}
        deletePassageError={deletePassageError}
        deleteBlockedByQuestions={deleteBlockedByQuestions}
        onRequestDelete={requestDeletePassage}
        onCancelDelete={cancelDeletePassage}
        onConfirmDelete={confirmDeletePassage}
        onClose={closePassageManager}
      />
    </>
  );
};

export default QuestionsPage;
