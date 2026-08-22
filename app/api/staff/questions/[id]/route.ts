import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { Question } from "@/lib/models/question.model";
import { Exam, recomputeExamTotals } from "@/lib/models/exam.model";

const EDITABLE_FIELDS = ["text", "marks", "options", "correctAnswer"] as const;

// Shared ownership + scope check: a teacher may only touch a question
// they created themselves, and only while that question's subject+class
// is still within their current assignment (an admin removing an
// assignment immediately locks out further edits to that slice).
async function loadOwnedQuestion(id: string, staffId: string) {
  const question = await Question.findById(id);
  if (!question) return { error: NextResponse.json({ error: "Question not found" }, { status: 404 }) };

  if (question.createdByModel !== "Staff" || question.createdBy.toString() !== staffId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const scope = await assertTeacherScope(staffId, question.subject.toString(), question.class);
  if (!scope.ok) return { error: scope.response };

  return { question };
}

// PATCH /api/staff/questions/[id]
// Body: any subset of { text, marks, options, correctAnswer }. Subject and
// class are intentionally not editable here - moving a question outside
// the teacher's assignment would just re-trigger the same scope problem
// POST already guards against, so it's simpler to disallow it outright.
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  await connectDB();
  const body = await req.json();

  const { question, error } = await loadOwnedQuestion(id, guard.session.user.id);
  if (error) return error;

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  try {
    Object.assign(question!, updates);
    await question!.save();

    if (updates.marks !== undefined) {
      const examsUsingIt = await Exam.find({ "questions.question": id }).select("_id");
      await Promise.all(examsUsingIt.map((exam) => recomputeExamTotals(exam.id)));
    }

    return NextResponse.json({ question });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update question";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/staff/questions/[id]
// Same "attached to a live exam" guard as the admin route - refuses unless
// ?force=true, since deleting it out from under an exam would orphan
// student submissions.
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const force = req.nextUrl.searchParams.get("force") === "true";
  await connectDB();

  const { error } = await loadOwnedQuestion(id, guard.session.user.id);
  if (error) return error;

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

  await Question.findByIdAndDelete(id);
  return NextResponse.json({ deleted: true });
}
