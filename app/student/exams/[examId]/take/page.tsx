"use client";

import React from "react";
import ExamHeader from "@/components/student/exam-taking/ExamHeader";
import Timer from "@/components/student/exam-taking/Timer";
import TimerAnnouncement from "@/components/student/exam-taking/TimerAnnouncement";
import QuestionsList from "@/components/student/exam-taking/QuestionsList";
import SubmitDialog from "@/components/student/exam-taking/SubmitDialog";
import ExamNotFound from "@/components/student/exam-taking/ExamNotFound";
import ExamSubmitted from "@/components/student/exam-taking/ExamSubmitted";
import StatusMessage from "@/components/ui/StatusMessage";
import { useExamTaking } from "@/hooks/useExamTaking";

const ExamPage: React.FC = () => {
  const {
    isLoading,
    loadError,
    exam,
    questions,
    answers,
    remainingSeconds,
    syncState,
    statusMessage,
    timerAnnouncement,
    showSubmitDialog,
    isSubmitting,
    isSubmitted,
    result,
    submitButtonRef,
    handleAnswerChange,
    handleSubmitExam,
    confirmSubmit,
    cancelSubmit,
    getAnsweredCount,
    getTotalQuestions,
    goToExamsList,
  } = useExamTaking();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center">
        <p className="text-[#4A6A8A]">Loading your exam...</p>
      </div>
    );
  }

  if (loadError || !exam) {
    return <ExamNotFound message={loadError ?? undefined} />;
  }

  if (isSubmitted) {
    return <ExamSubmitted exam={exam} result={result} onDone={goToExamsList} />;
  }

  return (
    <div className="min-h-screen bg-[#E8F0FE] py-6 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
        <ExamHeader exam={exam} />

        <Timer
          timeRemaining={remainingSeconds}
          answeredCount={getAnsweredCount()}
          totalQuestions={getTotalQuestions()}
          syncState={syncState}
        />
        <TimerAnnouncement announcement={timerAnnouncement} />

        {statusMessage && (
          <div className="px-6 py-3 border-x bg-white">
            <StatusMessage type={statusMessage.type} text={statusMessage.text} />
          </div>
        )}

        <main className="bg-white rounded-b-2xl shadow-2xl overflow-hidden border border-[#B8D0E8] p-6">
          {exam.instructions && (
            <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6 text-sm text-[#4A6A8A]">
              <span className="font-medium text-[#1A3A5C]">Instructions: </span>
              {exam.instructions}
            </div>
          )}

          <QuestionsList
            questions={questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />

          <div className="flex flex-col sm:flex-row gap-4 justify-end border-t border-[#E8EEF5] pt-6 mt-6">
            <button
              ref={submitButtonRef}
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-6 rounded-lg transition duration-200 shadow-md disabled:opacity-50"
              aria-label={`Submit your exam. ${getAnsweredCount()} of ${getTotalQuestions()} questions answered.`}>
              Submit Exam
            </button>
          </div>
        </main>
      </div>

      <SubmitDialog
        isOpen={showSubmitDialog}
        exam={exam}
        answeredCount={getAnsweredCount()}
        totalQuestions={getTotalQuestions()}
        timeRemaining={remainingSeconds}
        isSubmitting={isSubmitting}
        onConfirm={confirmSubmit}
        onCancel={cancelSubmit}
      />
    </div>
  );
};

export default ExamPage;
