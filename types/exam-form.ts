export type RequiredField = "title" | "subject" | "class" | "term" | "date" | "time";
export type FieldErrors = Partial<Record<RequiredField, string>>;

export interface ExamFormData {
  title: string;
  subject: string;
  class: string;
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
  term: "",
  date: "",
  time: "",
  duration: 60,
  type: "objective",
  instructions: "",
  passingScore: 40,
  shuffleQuestions: false,
};
