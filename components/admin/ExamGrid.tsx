import { Exam } from "@/types/exam.types";
import ExamCard from "./ExamCard";
interface ExamGridProps {
  exams: Exam[];
  onDelete: (exam: Exam) => void;
}

const ExamGrid: React.FC<ExamGridProps> = ({ exams, onDelete }) => {
  return (
    <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exams.map((exam) => {
        return <ExamCard key={exam.id} exam={exam} onDelete={onDelete} />;
      })}
    </ul>
  );
};
export default ExamGrid;
