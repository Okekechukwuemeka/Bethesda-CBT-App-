import React from "react";
import { Exam } from "@/types/student-exam";
import ExamCard from "./ExamCard";

interface ExamListProps {
  exams: Exam[];
  onStartExam: (exam: Exam, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ExamList: React.FC<ExamListProps> = ({ exams, onStartExam }) => {
  if (exams.length === 0) {
    return (
      <p className="text-center text-[#4A6A8A] py-8">
        You have no examinations available right now. Check back later.
      </p>
    );
  }

  return (
    <ul className="space-y-4 list-none" aria-label="Available examinations">
      {exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} onStartExam={onStartExam} />
      ))}
    </ul>
  );
};

export default ExamList;
