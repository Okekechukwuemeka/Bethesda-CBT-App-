import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Exam } from "@/lib/models/exam.model";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";
import type { ClassLevel } from "@/lib/models/constants";
import type {
  ExamTypeLower,
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

interface SubmissionLean {
  status: string;
  score: number;
  totalMarks: number;
}

export interface ExamLean {
  _id: mongoose.Types.ObjectId | string;
  subject: { name?: string } | string;
  type: string;
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

  const averageScore =
    percentages.length > 0
      ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
      : 0;
  const highestScore = percentages.length > 0 ? Math.round(Math.max(...percentages)) : 0;
  const lowestScore = percentages.length > 0 ? Math.round(Math.min(...percentages)) : 0;

  const markedCount = marked.length;
  let status: ResultStatus = "pending";
  if (totalStudents > 0 && markedCount >= totalStudents) status = "completed";
  else if (markedCount > 0 || submissions.length > 0) status = "in-progress";

  return {
    id: exam._id.toString(),
    subject:
      typeof exam.subject === "string" ? exam.subject : (exam.subject?.name ?? "Unknown Subject"),
    examType: toLowerExamType(exam.type),
    totalStudents,
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
