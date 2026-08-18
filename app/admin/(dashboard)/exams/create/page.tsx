"use client";

import React from "react";
import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import StatusMessage from "@/components/ui/StatusMessage";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ScheduleSection from "@/components/admin/exam-form/ScheduleSection";
import ScoringSection from "@/components/admin/exam-form/ScoringSection";
import InstructionsSection from "@/components/admin/exam-form/InstructionsSection";
import QuestionsCsvUploadModal from "@/components/admin/exam-form/QuestionsCsvUploadModal";
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

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

const CreateExamPage: React.FC = () => {
  // console.log({
  //   PageHeader,
  //   StatusMessage,
  //   ConfirmDialog,
  //   ScheduleSection,
  //   ScoringSection,
  //   InstructionsSection,
  //   QuestionsCsvUploadModal,
  //   SuccessStateWithQuestions,
  //   ExamDetailsSection,
  // });
  const {
    formData,
    isSubmitting,
    isSubmitted,
    createdExamCode,
    createdExamId,
    importedQuestionCount,
    statusMessage,
    fieldErrors,
    subjects,
    isLoadingSubjects,
    titleMode,
    handleTitleModeChange,
    titleInputRef,
    fieldRefs,
    questionsCsvFile,
    showBulkImportModal,
    partialErrorMessage,
    handleInputChange,
    handleIsGeneralChange,
    handleClassesToggle,
    handleQuestionsCsvSelect,
    handleSubmit,
    resetForm,
    setShowBulkImportModal,
    clearPartialErrorMessage,
  } = useCreateExamWithQuestions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Exam"
        description="Create a new examination"
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
            examId={createdExamId}
            questionCount={importedQuestionCount}
            examCode={createdExamCode}
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
              subjects={subjects}
              isLoadingSubjects={isLoadingSubjects}
              titleMode={titleMode}
              onTitleModeChange={handleTitleModeChange}
              onIsGeneralChange={handleIsGeneralChange}
              onClassesToggle={handleClassesToggle}
            />

            <ScheduleSection
              formData={formData}
              fieldErrors={fieldErrors}
              fieldRefs={fieldRefs}
              onChange={handleInputChange}
            />

            <ScoringSection formData={formData} onChange={handleInputChange} />

            <InstructionsSection formData={formData} onChange={handleInputChange} />

            <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4">
              <p className="text-sm font-medium text-[#1A3A5C] mb-1">Questions (optional)</p>
              <p className="text-sm text-[#5A7A9A] mb-3">
                Import a set of questions now via CSV, or skip this and add questions afterward from
                the exam&apos;s Questions page.
              </p>
              {questionsCsvFile && (
                <p className="text-sm text-green-700 mb-3">
                  CSV ready: <strong>{questionsCsvFile.name}</strong> (imported when you create the
                  exam)
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowBulkImportModal(true)}
                className="flex items-center gap-2 text-sm bg-white border border-[#2B6CB0] text-[#2B6CB0] font-medium px-4 py-2 rounded-lg hover:bg-[#E8F0FE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
                <UploadIcon />
                {questionsCsvFile ? "Change CSV" : "Import from CSV"}
              </button>
            </div>

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
                {isSubmitting ? "Creating..." : "Create Exam"}
              </button>
            </div>
          </form>
        )}
      </div>

      <QuestionsCsvUploadModal
        isOpen={showBulkImportModal}
        currentFile={questionsCsvFile}
        onSelectFile={handleQuestionsCsvSelect}
        onClose={() => setShowBulkImportModal(false)}
      />

      <ConfirmDialog
        isOpen={!!partialErrorMessage}
        title="Exam created, but with a problem"
        description={partialErrorMessage}
        confirmLabel="Okay"
        onConfirm={clearPartialErrorMessage}
      />
    </div>
  );
};

export default CreateExamPage;
