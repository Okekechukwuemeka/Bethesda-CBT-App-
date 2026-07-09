import React from "react";
import { Exam } from "@/types/exam";
import ExamCard from "./ExamCard";

interface ExamGridProps {
  exams: Exam[];
}

const ExamGrid: React.FC<ExamGridProps> = ({ exams }) => {
  return (
    <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} />
      ))}
    </ul>
  );
};

export default ExamGrid;
