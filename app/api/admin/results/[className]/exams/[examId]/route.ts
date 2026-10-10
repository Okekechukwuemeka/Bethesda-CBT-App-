import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { deleteResultsOfDeletedExam } from "@/lib/results-helpers";
import type { ClassLevel } from "@/lib/models/constants";

// DELETE /api/admin/results/[className]/exams/[examId]
//
// Permanently deletes the student results that were kept after an exam was
// deleted. Deleting an exam never deletes results (see DELETE
// /api/admin/exams/[examId]); this is the separate, deliberate step for
// clearing them out.
//
// Admin only (teachers can view preserved results but never delete them),
// and limited to results whose exam no longer exists - it will not remove
// the results of an exam that is still there. See deleteResultsOfDeletedExam
// for exactly what is and isn't matched.
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ className: string; examId: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { className: rawClassName, examId } = await context.params;
  const className = decodeURIComponent(rawClassName) as ClassLevel;

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Invalid exam ID format" }, { status: 400 });
  }

  await connectDB();
  const outcome = await deleteResultsOfDeletedExam(className, examId);

  if (!outcome.ok) {
    if (outcome.reason === "exam-still-exists") {
      return NextResponse.json(
        {
          error:
            "This exam still exists. Results can only be deleted here once the exam itself has been deleted.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "No saved results from a deleted exam were found for this class." },
      { status: 404 },
    );
  }

  return NextResponse.json({ deleted: true, deletedCount: outcome.deletedCount });
}
