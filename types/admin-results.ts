export type ExamTypeLower = "objective" | "theory" | "mixed";
export type ResultStatus = "completed" | "pending" | "in-progress";
export type ScriptStatus = "marked" | "pending" | "in-progress" | "not-started";
export type Performance = "excellent" | "good" | "average" | "poor";

export interface ClassResult {
  className: string;
  studentCount: number;
  completedExams: number;
  averageScore: number;
  performance: Performance;
}

export interface SubjectResult {
  id: string;
  subject: string;
  examType: ExamTypeLower;
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completed: number;
  status: ResultStatus;
}

export interface StudentAnswer {
  questionNo: number;
  answer: string;
}

export interface StudentScript {
  id: string;
  studentName: string;
  admissionNo: string;
  score: number;
  status: ScriptStatus;
  submittedAt: string;
  answers?: StudentAnswer[];
}
