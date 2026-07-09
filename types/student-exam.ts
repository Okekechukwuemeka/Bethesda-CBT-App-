export interface Exam {
  id: number;
  subject: string;
  term: string;
  date: string;
  time: string;
  duration: string;
  code: string;
  slug: string;
  type: "objective" | "theory" | "mixed";
}

export interface StatusMessage {
  type: "success" | "error";
  text: string;
}
