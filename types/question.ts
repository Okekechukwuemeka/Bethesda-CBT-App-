import type { ClassLevel, QuestionType } from "@/lib/models/constants";

export interface Subject {
  _id: string;
  name: string;
  code: string;
}

// `subject` comes back populated ({ _id, name, code }) from GET, but you
// only ever send a subject id on create/update — QuestionInput reflects that.
export interface Question {
  _id: string;
  text: string;
  type: QuestionType;
  subject: Subject | string;
  class: ClassLevel;
  marks: number;
  options?: string[];
  correctAnswer?: string;
  createdAt: string;
  createdBy?: string;
}

export interface QuestionInput {
  text: string;
  type: QuestionType;
  subject: string;
  class: ClassLevel | "";
  marks: number;
  options?: string[];
  correctAnswer?: string;
}

export interface RowError {
  row: number;
  error: string;
}

export interface BlockingExam {
  id: string;
  title: string;
}
