import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Subject } from "@/lib/models/subject.model";
import { syncExamStatus } from "@/lib/exam-status";
import { deleteExamPreservingResults } from "@/lib/exam-snapshot";

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
  "objectiveInstructions",
  "theoryInstructions",
  "passingScore",
  "shuffleQuestions",
  "isCodeActive",
] as const;

// DELETE /api/admin/exams/[examId]
// Deletes the exam but KEEPS every student submission (result) that was
// recorded against it. Before the exam is removed, the details those
// results need to stay meaningful (title, subject, class, term, theory
// question numbering...) are copied onto each submission - see
// lib/exam-snapshot.ts. The results then stay on the Results pages, marked
// as belonging to a deleted exam, until an admin deletes them there.
//
// There is deliberately no ?force=true any more: deleting an exam no longer
// destroys anything that needs a second confirmation. (The parameter is
// ignored if an old client still sends it.)
export async function DELETE(_req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }
  await connectDB();

  try {
    const outcome = await deleteExamPreservingResults(examId);
    if (!outcome) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    return NextResponse.json({ deleted: true, preservedResults: outcome.preservedResults });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete exam";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
