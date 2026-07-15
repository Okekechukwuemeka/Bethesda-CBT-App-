"use client";

import React from "react";
import { useSession } from "next-auth/react";
import ExamPageHeader from "@/components/student/ExamPageHeader";
import ExamList from "@/components/student/ExamList";
import Modal from "@/components/ui/Modal";
import ExamCodeForm from "@/components/student/ExamCodeForm";
import StatusMessageComponent from "@/components/ui/StatusMessage";
import { useStudentExams } from "@/hooks/useStudentExams";

const StudentExamsPage: React.FC = () => {
  const { data: session } = useSession();
  const {
    exams,
    isLoadingExams,
    examsError,
    selectedExam,
    examCode,
    isModalOpen,
    statusMessage,
    isCodeVerified,
    isVerifying,
    setExamCode,
    handleExamClick,
    handleModalClose,
    handleCodeSubmit,
  } = useStudentExams();

  return (
    <div className="min-h-screen bg-[#E8F0FE] py-8 px-4 font-sans">
      <div aria-hidden={isModalOpen ? true : undefined} className="max-w-4xl mx-auto">
        <ExamPageHeader examCount={exams.length} studentClass={session?.user?.class} />

        <main className="bg-white rounded-b-2xl shadow-2xl overflow-hidden border border-[#B8D0E8] p-6">
          {isLoadingExams ? (
            <p className="text-center text-[#4A6A8A] py-8">Loading your examinations...</p>
          ) : examsError ? (
            <StatusMessageComponent type="error" text={examsError} />
          ) : (
            <ExamList exams={exams} onStartExam={handleExamClick} />
          )}
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title="Enter Examination Code"
        disableClose={isCodeVerified || isVerifying}>
        {selectedExam && (
          <ExamCodeForm
            exam={selectedExam}
            examCode={examCode}
            onExamCodeChange={setExamCode}
            onSubmit={handleCodeSubmit}
            onCancel={handleModalClose}
            statusMessage={statusMessage}
            isCodeVerified={isCodeVerified}
            isVerifying={isVerifying}
          />
        )}
      </Modal>
    </div>
  );
};

export default StudentExamsPage;
