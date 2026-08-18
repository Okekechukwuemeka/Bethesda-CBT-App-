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
  // Set for a normal, class-specific exam; empty/undefined for a general
  // exam (isGeneral: true), which uses `classes` instead.
  class?: string;
  // Only set when isGeneral is true - every class eligible to sit this
  // exam.
  classes?: string[];
  isGeneral: boolean;
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

// Deliberately "id"-keyed, not "_id"-keyed, to match BankQuestion below -
// this file already has a mixed convention (PopulatedSubject uses _id,
// BankQuestion uses id), so this follows whichever object it's attached to
// rather than forcing one convention across the whole file.
export interface BankQuestionPassage {
  id: string;
  title?: string;
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
  // Present only when this question is part of a shared passage. Absent
  // (undefined) means it's a standalone question - unchanged from before
  // passages existed.
  passage?: BankQuestionPassage;
  passageOrder?: number;
}
