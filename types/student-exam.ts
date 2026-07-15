export type ExamType = "Objective" | "Theory" | "Mixed";
export type ExamStatus = "Scheduled" | "Ongoing" | "Completed";

export interface Exam {
  id: string;
  title: string;
  subject: string;
  term: string;
  academicYear: string;
  examDate: string;
  duration: number;
  type: ExamType;
  status: ExamStatus;
  totalMarks: number;
  questionCount: number;
  isAvailable: boolean;
}

export interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}
