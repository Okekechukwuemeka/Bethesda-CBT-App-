export type ExamTypeLower = "objective" | "theory" | "mixed";
// Exam-level status on the Results page:
//  - pending:          nobody has started it
//  - in-progress:      at least one student is still writing it
//  - awaiting-marking: everyone who sat it has SUBMITTED; only marking (e.g.
//                      the theory part of a mixed exam) is outstanding
//  - completed:        every student's script is marked
export type ResultStatus = "completed" | "pending" | "in-progress" | "awaiting-marking";
export type ScriptStatus = "marked" | "pending" | "in-progress" | "not-started";
export type Performance = "excellent" | "good" | "average" | "poor";

export interface ClassResult {
  className: string;
  studentCount: number;
  totalExams: number;
}

export interface SubjectResult {
  id: string;
  subject: string;
  examTitle: string;
  examType: ExamTypeLower;
  totalStudents: number;
  totalMarks: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completed: number;
  status: ResultStatus;
  // True when this row describes results whose exam has since been deleted.
  // Such rows are built from the snapshot kept on the submissions, can still
  // be viewed/exported, and (for admins) deleted.
  examDeleted?: boolean;
  term?: string;
  academicYear?: string;
}

export interface StudentAnswer {
  questionNo: number;
  answer: string;
}
export interface StudentScript {
  id: string;
  studentName: string;
  admissionNo: string;
  score: number; // raw score, e.g. 7
  totalMarks: number; // e.g. 10
  percentage: number; // derived, e.g. 70
  status: ScriptStatus;
  submittedAt: string;
  answers?: StudentAnswer[];
  // Auto-graded MCQ portion. Only populated for Mixed exams whose script
  // hasn't been fully marked yet - `score` above stays 0 until theory is
  // marked, but the MCQ part is already known the moment the student submits.
  objectiveScore?: number;
  objectiveTotal?: number;
  // Theory (essay) part, for Theory and Mixed exams only. `theoryTotal` is the
  // most a marker can award for it (the whole exam for a Theory exam, the exam
  // minus the MCQ section for a Mixed one). `theoryScore` is the mark a teacher
  // or admin has already entered, or null while the script is still unmarked.
  // Only set for students who have submitted.
  theoryScore?: number | null;
  theoryTotal?: number;
}

export interface TheoryScoreEntry {
  studentId: string;
  // null removes a previously entered score (the script goes back to
  // "Awaiting Marking").
  theoryScore: number | null;
}

export interface TheoryScoreFailure {
  studentId: string;
  error: string;
}

export interface SaveTheoryScoresResponse {
  savedCount: number;
  failures: TheoryScoreFailure[];
  // The class's refreshed script list for the exam, so the screen can update
  // without a second request.
  students: StudentScript[];
}

export interface ClassExportRow {
  admissionNo: string;
  studentName: string;
  score: number; // raw score
  totalMarks: number;
  percentage: number;
  status: ScriptStatus;
  // See StudentScript - MCQ portion of a Mixed exam, known before theory is marked.
  objectiveScore?: number;
  objectiveTotal?: number;
}
