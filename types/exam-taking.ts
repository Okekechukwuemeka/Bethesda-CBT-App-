export interface ExamData {
  slug: string;
  subject: string;
  class: string;
  term: string;
  date: string;
  time: string;
  duration: number;
  type: "objective" | "theory" | "mixed";
  instructions: string[];
  questions: Question[];
}

export interface Question {
  id: number;
  text: string;
  options?: string[];
  type: "objective" | "theory";
  marks: number;
}

export interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}
