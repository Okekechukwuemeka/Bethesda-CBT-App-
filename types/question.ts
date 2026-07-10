export interface Question {
  id: number;
  text: string;
  type: "objective" | "theory";
  options: string[];
  correctAnswer: string;
  marks: number;
  subject: string;
  class: string;
  difficulty: "easy" | "medium" | "hard";
}
