import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Exam } from "@/lib/models/exam.model";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";
import type { ClassLevel } from "@/lib/models/constants";
import type {
  ExamTypeLower,
  Performance,
  ResultStatus,
  ScriptStatus,
  SubjectResult,
} from "@/types/admin-results";

export function toLowerExamType(type: string): ExamTypeLower {
  return type.toLowerCase() as ExamTypeLower;
}

export function toScriptStatus(status?: string): ScriptStatus {
  if (status === "Marked") return "marked";
  if (status === "Submitted") return "pending"; // turned in, awaiting manual marking
  if (status === "In Progress") return "in-progress";
  return "not-started";
}

// Thresholds are a reasonable default (>=75 excellent, >=60 good, >=45
// average, below that poor) - adjust to match the school's actual grading
// scale if this doesn't line up with their existing bands. Shared between
// the classes list and anywhere else that needs to bucket a percentage
// into a performance tier, so the bands only ever live in one place.
export function bucketPerformance(avg: number): Performance {
  if (avg >= 75) return "excellent";
  if (avg >= 60) return "good";
  if (avg >= 45) return "average";
  return "poor";
}

interface SubmissionLean {
  status: string;
  score: number;
  totalMarks: number;
}

export interface ExamLean {
  _id: mongoose.Types.ObjectId | string;
  subject: { name?: string } | string;
  title: string;
  type: string;
  totalMarks: number;
}

// One row per exam ("subject" on the Results page). Completion is judged
// by how many students actually have a fully-Marked submission, NOT by
// the exam's own `status` field - an exam can be "Completed" (its sitting
// window closed) while theory scripts still sit unmarked, and that's
// exactly the case this page needs to surface, not hide behind a
// misleadingly green "completed" badge.
export function buildSubjectResult(
  exam: ExamLean,
  submissions: SubmissionLean[],
  totalStudents: number,
): SubjectResult {
  const marked = submissions.filter((s) => s.status === "Marked" && s.totalMarks > 0);
  const percentages = marked.map((s) => (s.score / s.totalMarks) * 100);
  const rawScores = marked.map((s) => s.score);

  const averageScore =
    percentages.length > 0
      ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
      : 0;
  // Raw scores, not percentages - the Results table shows "8/10", not
  // "80%", so a teacher reads it the same way they'd read a mark sheet.
  const highestScore = rawScores.length > 0 ? Math.max(...rawScores) : 0;
  const lowestScore = rawScores.length > 0 ? Math.min(...rawScores) : 0;

  const markedCount = marked.length;
  let status: ResultStatus = "pending";
  if (totalStudents > 0 && markedCount >= totalStudents) status = "completed";
  else if (markedCount > 0 || submissions.length > 0) status = "in-progress";

  return {
    id: exam._id.toString(),
    subject:
      typeof exam.subject === "string" ? exam.subject : (exam.subject?.name ?? "Unknown Subject"),
    examTitle: exam.title,
    examType: toLowerExamType(exam.type),
    totalStudents,
    totalMarks: exam.totalMarks,
    averageScore,
    highestScore,
    lowestScore,
    completed: markedCount,
    status,
  };
}

export async function getClassActiveStudentCount(className: ClassLevel): Promise<number> {
  await connectDB();
  return Student.countDocuments({ class: className, isActive: true });
}

export async function getExamsForClass(className: ClassLevel) {
  await connectDB();
  return Exam.find({ class: className }).populate("subject", "name").sort({ examDate: -1 }).lean();
}

export async function getSubjectResultsForClass(className: ClassLevel): Promise<SubjectResult[]> {
  const [exams, totalStudents] = await Promise.all([
    getExamsForClass(className),
    getClassActiveStudentCount(className),
  ]);

  return Promise.all(
    exams.map(async (exam) => {
      const submissions = await Submission.find({ exam: exam._id })
        .select("status score totalMarks")
        .lean();
      return buildSubjectResult(exam as unknown as ExamLean, submissions, totalStudents);
    }),
  );
}

// Micro-average across every marked submission in the class (not an
// average of each subject's own average - see buildSubjectResult's
// comment for why that distinction matters). Used by the classes list
// page to show one headline number per class.
export async function getClassAverageScore(className: ClassLevel): Promise<number> {
  await connectDB();

  const classExams = await Exam.find({ class: className }).select("_id");
  const classExamIds = classExams.map((e) => e._id);
  if (classExamIds.length === 0) return 0;

  const markedSubmissions = await Submission.find({
    exam: { $in: classExamIds },
    status: "Marked",
  }).select("score totalMarks");

  const percentages = markedSubmissions
    .filter((s) => s.totalMarks > 0)
    .map((s) => (s.score / s.totalMarks) * 100);

  return percentages.length > 0
    ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
    : 0;
}
