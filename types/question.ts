import type { ClassLevel, QuestionType, PassageKind } from "@/lib/models/constants";

export interface Subject {
  _id: string;
  name: string;
  code: string;
}

// Full passage record, as returned by /api/admin/passages. questionCount is
// a server-computed aggregate (how many bank questions currently point at
// this passage) - it's what lets the question form auto-number a newly
// attached sub-question's passageOrder instead of asking the admin to
// track or type a number with no visual layout to check it against.
export interface Passage {
  _id: string;
  title?: string;
  text: string;
  kind: PassageKind;
  subject: string | Subject;
  class: ClassLevel;
  questionCount: number;
}

export interface PassageInput {
  title?: string;
  text: string;
  kind: PassageKind;
  subject: string;
  class: ClassLevel | "";
}

// Shape returned once a question's passageId is populated (GET /api/admin/questions
// and GET /api/admin/questions/[id] both .populate("passageId")). A question that
// isn't part of a passage simply has passageId: undefined - unchanged from before
// this existed.
export interface PopulatedPassage {
  _id: string;
  title?: string;
  text: string;
  kind: PassageKind;
}

export interface Question {
  _id: string;
  text: string;
  type: QuestionType;
  subject: string | Subject;
  class: ClassLevel;
  marks: number;
  options?: string[];
  correctAnswer?: string;
  passageId?: string | PopulatedPassage;
  passageOrder?: number;
}

export interface QuestionInput {
  text: string;
  type: QuestionType;
  subject: string;
  class: ClassLevel | "";
  marks: number;
  options?: string[];
  correctAnswer?: string;
  // "" = standalone (no passage). "__new__" = admin is creating a passage
  // inline as part of this submission. Any other value = an existing
  // Passage._id.
  passageId?: string;
  passageOrder?: number;
}

export interface BlockingExam {
  id: string;
  title: string;
}

export interface BlockingQuestion {
  id: string;
  text: string;
}

export interface RowError {
  row: number;
  error: string;
}
