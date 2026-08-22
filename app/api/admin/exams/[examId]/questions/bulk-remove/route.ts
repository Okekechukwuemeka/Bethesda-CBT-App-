import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam, recomputeExamTotals } from "@/lib/models/exam.model";

// POST /api/admin/exams/[examId]/questions/bulk-remove
// Body: { questionIds: string[] }
// Detaches every listed question from THIS exam only - same as DELETE
// /api/admin/exams/[examId]/questions/[questionId] but for many at once.
// Every one of them stays in the bank and stays attached to any other
// exam that also uses it.
export async function POST(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  await connectDB();
  const body = await req.json();
  const questionIds: string[] = Array.isArray(body.questionIds) ? body.questionIds : [];

  if (questionIds.length === 0) {
    return NextResponse.json({ error: "No question ids provided" }, { status: 400 });
  }

  const exam = await Exam.findById(examId);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const idSet = new Set(questionIds);
  const before = exam.questions.length;
  exam.questions = exam.questions.filter(
    (q) => !idSet.has(q.question.toString()),
  ) as typeof exam.questions;
  const removed = before - exam.questions.length;

  await exam.save();
  await recomputeExamTotals(exam.id);

  return NextResponse.json({ removed, totalQuestions: exam.questions.length });
}
