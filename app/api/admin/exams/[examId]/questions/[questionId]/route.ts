import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam, recomputeExamTotals } from "@/lib/models/exam.model";

// DELETE /api/admin/exams/[examId]/questions/[questionId]
// Removes this question from THIS exam only - it stays in the bank and
// stays attached to any other exam that also uses it.
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ examId: string; questionId: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId, questionId } = await context.params;
  await connectDB();

  const exam = await Exam.findById(examId);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const before = exam.questions.length;
  exam.questions = exam.questions.filter(
    (q) => q.question.toString() !== questionId,
  ) as typeof exam.questions;

  if (exam.questions.length === before) {
    return NextResponse.json(
      { error: "That question isn't attached to this exam" },
      {
        status: 404,
      },
    );
  }

  await exam.save();
  await recomputeExamTotals(exam.id);

  return NextResponse.json({ detached: true, totalQuestions: exam.questions.length });
}
