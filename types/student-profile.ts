// Shapes returned by the admin student-profile endpoints
// (/api/admin/students/[id]/profile and .../examinations/[key]).

export type StudentAccountStatus = "active" | "inactive" | "graduated";

export interface StudentProfileInfo {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  class: string;
  gender?: string;
  status: StudentAccountStatus;
  // When the student record was created.
  enrolledAt: string;
  classHistory: { class: string; academicYear: string; from?: string; to?: string }[];
}

// State of ONE paper (one subject's exam) for this student:
//  - marked:            fully scored (an Objective paper the moment it is
//                       submitted; a Theory/Mixed paper once the essay is marked)
//  - awaiting-marking:  handed in, but the essay (theory) part is not marked yet
//  - in-progress:       started but not submitted
export type PaperStatus = "marked" | "awaiting-marking" | "in-progress";

// State of a whole examination (all of this student's papers in one term):
//  - completed:         every paper is marked
//  - partially-marked:  some papers marked, others still waiting
//  - awaiting-marking:  handed in, nothing marked yet
//  - in-progress:       at least one paper is still being written
export type ExaminationStatus =
  | "completed"
  | "partially-marked"
  | "awaiting-marking"
  | "in-progress";

export interface PaperResult {
  submissionId: string;
  examId: string;
  // True when the exam itself has since been deleted - the result is kept.
  examDeleted: boolean;
  title: string;
  subject: string;
  type: "Objective" | "Theory" | "Mixed";
  examDate?: string;
  status: PaperStatus;
  submittedAt?: string;
  markedAt?: string;
  // Final score; null until the paper is fully marked.
  score: number | null;
  totalMarks: number;
  percentage: number | null;
  // Mixed papers: the platform-scored objective part, known from submission.
  objectiveScore?: number;
  objectiveTotal?: number;
  // Theory / Mixed papers: the essay part. theoryScore is null while unmarked.
  theoryScore?: number | null;
  theoryTotal?: number;
  // True when an essay (theory) section is still waiting for a marker.
  theoryPending: boolean;
}

export interface ExaminationSummary {
  // URL-safe id used in the detail route, e.g. "2025-2026_first-term".
  key: string;
  name: string;
  term: string;
  academicYear: string;
  firstDate?: string;
  lastDate?: string;
  papersTaken: number;
  markedCount: number;
  awaitingCount: number;
  inProgressCount: number;
  status: ExaminationStatus;
  // Totals over the MARKED papers only, so an unmarked essay never drags the
  // result down; null when nothing is marked yet.
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
}

export interface UpcomingExam {
  id: string;
  title: string;
  subject: string;
  type: "Objective" | "Theory" | "Mixed";
  term: string;
  academicYear: string;
  examDate: string;
  endsAt: string;
  duration: number;
  status: "Scheduled" | "Ongoing";
  isGeneral: boolean;
  // The student has already opened this exam and not yet handed it in.
  inProgress: boolean;
}

export interface StudentProfileSummary {
  papersTaken: number;
  papersMarked: number;
  papersAwaitingMarking: number;
  papersInProgress: number;
  // Average over marked papers (percentage); null when none are marked.
  averagePercentage: number | null;
}

export interface StudentProfileResponse {
  student: StudentProfileInfo;
  summary: StudentProfileSummary;
  examinations: ExaminationSummary[];
  upcoming: UpcomingExam[];
}

export interface ExaminationDetailResponse {
  student: Pick<StudentProfileInfo, "id" | "fullName" | "admissionNumber" | "class">;
  examination: ExaminationSummary;
  papers: PaperResult[];
}
