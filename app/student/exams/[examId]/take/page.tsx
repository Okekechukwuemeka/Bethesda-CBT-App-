"use client";

import React from "react";
import ExamHeader from "@/components/student/exam-taking/ExamHeader";
import Timer from "@/components/student/exam-taking/Timer";
import TimerAnnouncement from "@/components/student/exam-taking/TimerAnnouncement";
import ExamInstructions from "@/components/student/exam-taking/ExamInstructions";
import QuestionsList from "@/components/student/exam-taking/QuestionsList";
import SubmitDialog from "@/components/student/exam-taking/SubmitDialog";
import ExamNotFound from "@/components/student/exam-taking/ExamNotFound";
import ExamSubmitted from "@/components/student/exam-taking/ExamSubmitted";
import StatusMessage from "@/components/ui/StatusMessage";
import { useExamTaking } from "@/hooks/useExamTaking";

const ExamPage: React.FC = () => {
  const {
    exam,
    answers,
    timeRemaining,
    isExamStarted,
    isSubmitted,
    statusMessage,
    showSubmitDialog,
    timerAnnouncement,
    submitButtonRef,
    handleStartExam,
    handleAnswerChange,
    handleSubmitExam,
    confirmSubmit,
    cancelSubmit,
    getAnsweredCount,
    getTotalQuestions,
  } = useExamTaking();

  if (!exam) {
    return <ExamNotFound />;
  }

  if (isSubmitted) {
    return (
      <ExamSubmitted
        exam={exam}
        answeredCount={getAnsweredCount()}
        totalQuestions={getTotalQuestions()}
        isTimeUp={statusMessage?.type === "warning"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#E8F0FE] py-6 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
        <ExamHeader exam={exam} />

        <Timer
          timeRemaining={timeRemaining}
          isExamStarted={isExamStarted}
          onStartExam={handleStartExam}
          answeredCount={getAnsweredCount()}
          totalQuestions={getTotalQuestions()}
        />
        <TimerAnnouncement announcement={timerAnnouncement} />

        {statusMessage && (
          <div className="px-6 py-3 border-x">
            <StatusMessage type={statusMessage.type} text={statusMessage.text} />
          </div>
        )}

        <main className="bg-white rounded-b-2xl shadow-2xl overflow-hidden border border-[#B8D0E8] p-6">
          {!isExamStarted ? (
            <ExamInstructions instructions={exam.instructions} />
          ) : (
            <>
              <QuestionsList
                questions={exam.questions}
                answers={answers}
                onAnswerChange={handleAnswerChange}
              />

              <div className="flex flex-col sm:flex-row gap-4 justify-end border-t border-[#E8EEF5] pt-6 mt-4">
                <a
                  href="/student/exams"
                  className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 text-center">
                  Quit Exam
                </a>
                <button
                  ref={submitButtonRef}
                  onClick={handleSubmitExam}
                  className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98]"
                  aria-label={`Submit your exam. ${getAnsweredCount()} of ${getTotalQuestions()} questions answered.`}>
                  Submit Exam
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      <SubmitDialog
        isOpen={showSubmitDialog}
        exam={exam}
        answeredCount={getAnsweredCount()}
        totalQuestions={getTotalQuestions()}
        timeRemaining={timeRemaining}
        onConfirm={confirmSubmit}
        onCancel={cancelSubmit}
      />
    </div>
  );
};

export default ExamPage;
