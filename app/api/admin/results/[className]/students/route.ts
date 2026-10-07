import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { buildStudentScripts, loadExamResultsContext } from "@/lib/results-helpers";
import type { ClassLevel } from "@/lib/models/constants";

// GET /api/admin/results/[className]/students?examId=...
// Works both for an exam that still exists and for one that has since been
// deleted - in the latter case the exam's details come from the snapshot
// kept on its preserved results (see lib/exam-snapshot.ts).
export async function GET(req: NextRequest, context: { params: Promise<{ className: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // 1. Read className from the actual route parameters
  const { className: rawClassName } = await context.params;
  const className = decodeURIComponent(rawClassName) as ClassLevel;

  // 2. Read examId from the URL query search parameters (?examId=...)
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");

  // Validate the incoming query string parameters
  if (!examId || examId === "undefined" || examId === "null") {
    return NextResponse.json(
      { error: "Missing or invalid examId query parameter" },
      { status: 400 },
    );
  }
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Invalid exam ID format" }, { status: 400 });
  }

  await connectDB();

  const ctx = await loadExamResultsContext(examId);
  if (!ctx) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const students = await buildStudentScripts(className, ctx);

  return NextResponse.json({
    exam: { id: ctx.examId, title: ctx.title, type: ctx.type },
    students,
  });
}
