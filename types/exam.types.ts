export interface PopulatedSubject {
  _id: string;
  name: string;
  code: string;
}

export type ExamType = "Objective" | "Theory" | "Mixed";
export type ExamStatus = "Scheduled" | "Ongoing" | "Completed";
export type Term = "First Term" | "Second Term" | "Third Term";

export interface Exam {
  id: string;
  title: string;
  subject: PopulatedSubject;
  class: string;
  term: Term;
  academicYear: string;
  examDate: string; // ISO string
  duration: number; // minutes
  type: ExamType;
  questionCount: number;
  totalMarks: number;
  status: ExamStatus;
  examCode: string;
  isCodeActive: boolean;
  instructions?: string;
  passingScore: number;
  shuffleQuestions: boolean;
}

export interface BankQuestion {
  id: string;
  text: string;
  type: "Objective" | "Theory";
  subject: { id: string; name: string } | string;
  class: string;
  marks: number;
  options?: string[];
  correctAnswer?: string;
}
