"use client";

import React from "react";
import ExamPageHeader from "@/components/student/ExamPageHeader";
import ExamList from "@/components/student/ExamList";
import Modal from "@/components/ui/Modal";
import ExamCodeForm from "@/components/student/ExamCodeForm";
import { useStudentExams } from "@/hooks/useStudentExams";

const StudentExamsPage: React.FC = () => {
  const {
    exams,
    selectedExam,
    examCode,
    isModalOpen,
    statusMessage,
    isCodeVerified,
    setExamCode,
    handleExamClick,
    handleModalClose,
    handleCodeSubmit,
  } = useStudentExams();

  return (
    <div className="min-h-screen bg-[#E8F0FE] py-8 px-4 font-sans">
      <div aria-hidden={isModalOpen ? true : undefined} className="max-w-4xl mx-auto">
        <ExamPageHeader examCount={exams.length} />

        <main className="bg-white rounded-b-2xl shadow-2xl overflow-hidden border border-[#B8D0E8] p-6">
          <ExamList exams={exams} onStartExam={handleExamClick} />
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title="Enter Examination Code"
        disableClose={isCodeVerified}>
        {selectedExam && (
          <ExamCodeForm
            exam={selectedExam}
            examCode={examCode}
            onExamCodeChange={setExamCode}
            onSubmit={handleCodeSubmit}
            onCancel={handleModalClose}
            statusMessage={statusMessage}
            isCodeVerified={isCodeVerified}
          />
        )}
      </Modal>
    </div>
  );
};

export default StudentExamsPage;
