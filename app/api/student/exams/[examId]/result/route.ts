import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Submission } from "@/lib/models/submission.model";

export async function GET(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;
  const { session } = guard;

  const { examId } = await context.params;
  await connectDB();

  // Not required to still exist: an admin may have deleted the exam since
  // the student sat it, but the student's result is kept (with a snapshot of
  // the exam's title) and should stay viewable.
  const exam = await Exam.findById(examId);

  const submission = await Submission.findOne({ exam: examId, student: session.user.id });
  if (!exam && !submission) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }
  if (!submission) {
    return NextResponse.json({ error: "You have not attempted this exam" }, { status: 404 });
  }
  if (submission.status !== "Submitted" && submission.status !== "Marked") {
    return NextResponse.json({ error: "This exam has not been submitted yet" }, { status: 409 });
  }

  return NextResponse.json({
    examTitle: exam?.title ?? submission.examSnapshot?.title ?? "Deleted exam",
    status: submission.status,
    score: submission.status === "Marked" ? submission.score : null,
    totalMarks: submission.totalMarks,
    grade: submission.status === "Marked" ? submission.grade : null,
    submittedAt: submission.submittedAt,
  });
}
