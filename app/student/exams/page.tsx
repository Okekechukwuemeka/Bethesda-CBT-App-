"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import ExamPageHeader from "@/components/student/ExamPageHeader";
import ExamList from "@/components/student/ExamList";
import Modal from "@/components/ui/Modal";
import ExamCodeForm from "@/components/student/ExamCodeForm";
import StatusMessageComponent from "@/components/ui/StatusMessage";
import { useStudentExams } from "@/hooks/useStudentExams";

const StudentExamsPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/student/login" });
  };
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#E8F0FE] py-8 px-4 font-sans">
      <div aria-hidden={isModalOpen ? true : undefined} className="max-w-4xl mx-auto">
        <ExamPageHeader
          examCount={exams.length}
          studentClass={mounted ? session?.user?.class : undefined}
        />

        <main className="bg-white rounded-b-2xl shadow-2xl overflow-hidden border border-[#B8D0E8] p-6">
          {isLoadingExams ? (
            <p className="text-center text-[#4A6A8A] py-8">Loading your examinations...</p>
          ) : examsError ? (
            <StatusMessageComponent type="error" text={examsError} />
          ) : (
            <ExamList exams={exams} onStartExam={handleExamClick} />
          )}
        </main>

        <footer aria-label="Account actions" className="flex justify-center mt-6">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Log out of your student account"
            className="px-6 py-3 rounded-lg bg-white w-full border border-[#B8D0E8] text-[#2B4C6F] font-medium
                       hover:bg-[#F3F8FF] hover:border-[#2B4C6F] focus:outline-none focus-visible:ring-2
                       focus-visible:ring-[#2B4C6F] focus-visible:ring-offset-2 disabled:opacity-60
                       disabled:cursor-not-allowed transition-colors shadow-sm">
            {isLoggingOut ? "Logging out…" : "Log Out from Your Account"}
          </button>
        </footer>
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
