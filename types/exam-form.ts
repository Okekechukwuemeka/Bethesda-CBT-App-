export type RequiredField = "title" | "subject" | "class" | "term" | "date" | "time";
export type FieldErrors = Partial<Record<RequiredField, string>>;

export interface ExamFormData {
  title: string;
  subject: string;
  // Used when isGeneral is false (the default) - a single class.
  class: string;
  // Used when isGeneral is true - every class eligible to sit the exam.
  classes: string[];
  isGeneral: boolean;
  term: string;
  date: string;
  time: string;
  duration: number;
  type: "objective" | "theory" | "mixed";
  instructions: string;
  passingScore: number;
  shuffleQuestions: boolean;
}

export const initialFormData: ExamFormData = {
  title: "",
  subject: "",
  class: "",
  classes: [],
  isGeneral: false,
  term: "",
  date: "",
  time: "",
  duration: 60,
  type: "objective",
  instructions: "",
  passingScore: 40,
  shuffleQuestions: false,
};
