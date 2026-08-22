import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Subject } from "@/lib/models/subject.model";
import { syncExamStatus } from "@/lib/exam-status";

// GET /api/admin/exams/[examId]
export async function GET(_req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  await connectDB();

  // .lean() + manual subject resolution instead of .populate("subject",
  // "name code") - see the identical comment in the exams list route
  // (GET /api/admin/exams): populate casts `subject` to ObjectId while
  // hydrating, which throws if a legacy document has a raw string there.
  const exam = await Exam.findById(examId).lean();
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const rawSubject = exam.subject as unknown;
  const asString = String(rawSubject ?? "");
  let resolvedSubject: { name: string; code: string } | { _id: string; name: string; code: string };
  if (mongoose.Types.ObjectId.isValid(asString)) {
    const subjectDoc = await Subject.findById(asString).select("name code").lean();
    resolvedSubject = subjectDoc
      ? { _id: subjectDoc._id.toString(), name: subjectDoc.name, code: subjectDoc.code }
      : { name: "Unknown subject", code: "" };
  } else {
    resolvedSubject = { name: asString || "Unknown subject", code: "" };
  }

  const examWithResolvedSubject = { ...exam, subject: resolvedSubject };
  examWithResolvedSubject.status = await syncExamStatus(examWithResolvedSubject);

  return NextResponse.json({ exam: examWithResolvedSubject });
}

// PATCH /api/admin/exams/[examId]
// Body: any subset of { title, subject, class, classes, isGeneral, term,
// academicYear, type, examDate, duration, instructions, passingScore,
// shuffleQuestions, isCodeActive }
// `class` applies to a class-specific exam, `classes` (an array) to a
// general one (isGeneral: true) - see exam.model.ts's pre("validate")
// hook, which clears whichever of the two doesn't match isGeneral.
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
  "classes",
  "isGeneral",
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

  try {
    // Loaded + saved (rather than findByIdAndUpdate) so the model's
    // pre("validate") hook runs with the FULL merged document - that hook
    // is what clears `class` vs `classes` depending on isGeneral, and the
    // conditional `required` on each depends on seeing both fields
    // together, which update-validators can't reliably do across fields
    // that aren't all present in the same request body.
    const exam = await Exam.findById(examId);
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        (exam as unknown as Record<string, unknown>)[field] = body[field];
      }
    }

    await exam.save();
    await exam.populate("subject", "name code");

    // If the admin just changed examDate or duration, recompute status
    // immediately rather than waiting for the next GET - so the response
    // returned right here already reflects the new schedule.
    await syncExamStatus(exam);

    return NextResponse.json({ exam });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update exam";
    const isDuplicate = message.includes("duplicate key");
    return NextResponse.json(
      { error: isDuplicate ? "An exam like this already exists for this class/term" : message },
      { status: 400 },
    );
  }
}
