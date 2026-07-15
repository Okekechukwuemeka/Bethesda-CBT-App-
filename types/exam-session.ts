export type QuestionType = "Objective" | "Theory";
export type ExamType = "Objective" | "Theory" | "Mixed";

export interface SessionQuestion {
  _id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  marks: number;
  order: number;
  selectedOption?: string;
  textAnswer?: string;
}

export interface ExamSessionMeta {
  id: string;
  title: string;
  type: ExamType;
  duration: number;
  totalMarks: number;
  instructions?: string;
}

export interface ExamSessionResponse {
  exam: ExamSessionMeta;
  submissionId: string;
  startedAt: string;
  remainingSeconds: number;
  questions: SessionQuestion[];
}

export interface SubmitResult {
  submitted?: boolean;
  alreadySubmitted?: boolean;
  status: "Submitted" | "Marked";
  score: number;
  totalMarks: number;
}

export interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}
