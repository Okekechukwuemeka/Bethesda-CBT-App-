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
  // Present only when this question is part of a shared passage - a
  // comprehension text, an experiment write-up, a data table, etc.
  // passageText/passageTitle/passageKind are denormalized onto EVERY
  // sibling question in the group (not fetched separately), so the
  // taking-flow UI can render a question standalone without an extra
  // lookup. Absent (undefined) means an ordinary standalone question,
  // unchanged from before passages existed.
  passageId?: string;
  passageTitle?: string;
  passageText?: string;
  passageKind?: string;
  // This question's position within its passage group (1, 2, 3...),
  // separate from `order` which is its position in the exam as a whole.
  passageOrder?: number;
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
