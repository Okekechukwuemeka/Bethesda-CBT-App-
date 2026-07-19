export type ExamTypeLower = "objective" | "theory" | "mixed";
export type ResultStatus = "completed" | "pending" | "in-progress";
export type ScriptStatus = "marked" | "pending" | "in-progress" | "not-started";
export type Performance = "excellent" | "good" | "average" | "poor";

export interface ClassResult {
  className: string;
  studentCount: number;
  totalExams: number;
}

export interface SubjectResult {
  id: string;
  subject: string;
  examTitle: string;
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
  score: number; // raw score, e.g. 7
  totalMarks: number; // e.g. 10
  percentage: number; // derived, e.g. 70
  status: ScriptStatus;
  submittedAt: string;
  answers?: StudentAnswer[];
}

export interface ClassExportRow {
  admissionNo: string;
  studentName: string;
  score: number; // raw score
  totalMarks: number;
  percentage: number;
  status: ScriptStatus;
}
