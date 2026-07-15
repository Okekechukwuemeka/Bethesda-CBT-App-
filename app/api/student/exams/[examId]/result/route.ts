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

  const exam = await Exam.findById(examId);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const submission = await Submission.findOne({ exam: exam._id, student: session.user.id });
  if (!submission) {
    return NextResponse.json({ error: "You have not attempted this exam" }, { status: 404 });
  }
  if (submission.status !== "Submitted" && submission.status !== "Marked") {
    return NextResponse.json({ error: "This exam has not been submitted yet" }, { status: 409 });
  }

  return NextResponse.json({
    examTitle: exam.title,
    status: submission.status,
    score: submission.status === "Marked" ? submission.score : null,
    totalMarks: submission.totalMarks,
    grade: submission.status === "Marked" ? submission.grade : null,
    submittedAt: submission.submittedAt,
  });
}
