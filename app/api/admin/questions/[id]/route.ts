import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Question } from "@/lib/models/question.model";
import { Exam, recomputeExamTotals } from "@/lib/models/exam.model";

// GET /api/admin/questions/[id]
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  await connectDB();

  const question = await Question.findById(id)
    .populate("subject", "name code")
    .populate({ path: "questions.question", populate: { path: "passageId" } });
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  return NextResponse.json({ question });
}
const EDITABLE_FIELDS = [
  "text",
  "type",
  "subject",
  "class",
  "marks",
  "options",
  "correctAnswer",
  "passageId",
  "passageOrder",
] as const;

// PATCH /api/admin/questions/[id]
// Editing marks here does NOT automatically update exams that already
// have this question attached - call recomputeExamTotals for those exams
// yourself if you need totals to reflect the change immediately, or just
// let it happen the next time a question is attached/detached.
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  await connectDB();
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  try {
    const question = await Question.findById(id);
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    Object.assign(question, updates);
    await question.save(); // runs the objective/theory pre-validate rule

    // Marks may have changed - keep every exam that uses this question
    // accurate rather than silently stale.
    if (updates.marks !== undefined) {
      const examsUsingIt = await Exam.find({ "questions.question": id }).select("_id");
      await Promise.all(examsUsingIt.map((exam) => recomputeExamTotals(exam.id)));
    }

    return NextResponse.json({ question });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update question";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/questions/[id]
// Refuses to delete a question that's still attached to one or more exams
// unless ?force=true - deleting it out from under a live exam would leave
// student submissions pointing at a question that no longer exists.
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const force = req.nextUrl.searchParams.get("force") === "true";
  await connectDB();

  const examsUsingIt = await Exam.find({ "questions.question": id });

  if (examsUsingIt.length > 0 && !force) {
    return NextResponse.json(
      {
        error: `This question is attached to ${examsUsingIt.length} exam(s). Pass ?force=true to detach and delete anyway.`,
        exams: examsUsingIt.map((e) => ({ id: e.id, title: e.title })),
      },
      { status: 409 },
    );
  }

  if (force && examsUsingIt.length > 0) {
    await Promise.all(
      examsUsingIt.map(async (exam) => {
        exam.questions = exam.questions.filter(
          (q) => q.question.toString() !== id,
        ) as typeof exam.questions;
        await exam.save();
        await recomputeExamTotals(exam.id);
      }),
    );
  }

  const question = await Question.findByIdAndDelete(id);
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  return NextResponse.json({ deleted: true });
}
