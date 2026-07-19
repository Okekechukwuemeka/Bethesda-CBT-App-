import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { syncExamStatus } from "@/lib/exam-status";

// GET /api/admin/exams/[examId]
export async function GET(_req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  await connectDB();

  const exam = await Exam.findById(examId).populate("subject", "name code");
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  await syncExamStatus(exam);

  return NextResponse.json({ exam });
}

// PATCH /api/admin/exams/[examId]
// Body: any subset of { title, subject, class, term, academicYear, type,
// examDate, duration, instructions, passingScore, shuffleQuestions,
// isCodeActive }
//
// "status" was removed from EDITABLE_FIELDS - it's now always computed
// from examDate/duration (see lib/exam-status.ts), so accepting it here
// would let an admin set a value that gets silently overwritten on the
// very next read. examCode itself is intentionally not editable here -
// regenerating it would invalidate a code students may have already been
// given. Add a dedicated POST /api/admin/exams/[examId]/regenerate-code
// route if you need that as an explicit, deliberate action later.
const EDITABLE_FIELDS = [
  "title",
  "subject",
  "class",
  "term",
  "academicYear",
  "type",
  "examDate",
  "duration",
  "instructions",
  "passingScore",
  "shuffleQuestions",
  "isCodeActive",
] as const;

// DELETE /api/admin/exams/[examId]
// Refuses to delete an exam that already has student submissions unless
// ?force=true is passed - silently destroying student work is worse than
// asking for one extra confirmation click.
export async function DELETE(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  const force = req.nextUrl.searchParams.get("force") === "true";
  await connectDB();

  const { Submission } = await import("@/lib/models/submission.model");
  const submissionCount = await Submission.countDocuments({ exam: examId });

  if (submissionCount > 0 && !force) {
    return NextResponse.json(
      {
        error: `This exam has ${submissionCount} student submission(s). Pass ?force=true to delete anyway.`,
        submissionCount,
      },
      { status: 409 },
    );
  }

  const exam = await Exam.findByIdAndDelete(examId);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  if (force && submissionCount > 0) {
    await Submission.deleteMany({ exam: examId });
  }

  return NextResponse.json({ deleted: true });
}

// PATCH /api/admin/exams/[examId]
// Body: any subset of the EDITABLE_FIELDS above.
export async function PATCH(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  await connectDB();
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  try {
    const exam = await Exam.findByIdAndUpdate(examId, updates, {
      new: true,
      runValidators: true,
    }).populate("subject", "name code");

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // If the admin just changed examDate or duration, recompute status
    // immediately rather than waiting for the next GET - so the response
    // returned right here already reflects the new schedule.
    await syncExamStatus(exam);

    return NextResponse.json({ exam });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update exam";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
