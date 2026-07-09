export interface Exam {
  id: number;
  title: string;
  subject: string;
  class: string;
  term: string;
  date: string;
  time: string;
  duration: number;
  type: "objective" | "theory" | "mixed";
  questionCount: number;
  status: "scheduled" | "ongoing" | "completed";
}
