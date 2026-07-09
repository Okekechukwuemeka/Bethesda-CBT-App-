import React from "react";
import { Exam } from "@/types/student-exam";
import ExamCard from "./ExamCard";

interface ExamListProps {
  exams: Exam[];
  onStartExam: (exam: Exam, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ExamList: React.FC<ExamListProps> = ({ exams, onStartExam }) => {
  return (
    <ul className="space-y-4 list-none" aria-label="Available examinations">
      {exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} onStartExam={onStartExam} />
      ))}
    </ul>
  );
};

export default ExamList;
