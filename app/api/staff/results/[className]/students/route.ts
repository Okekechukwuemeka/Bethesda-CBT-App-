import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { buildStudentScripts, loadExamResultsContext } from "@/lib/results-helpers";
import type { ClassLevel } from "@/lib/models/constants";

// GET /api/staff/results/[className]/students?examId=...
// Same as the admin route, but refuses to serve scripts for an exam
// outside this teacher's assigned subject+class. Works for exams that have
// since been deleted too (their subject is kept in the preserved snapshot).
export async function GET(req: NextRequest, context: { params: Promise<{ className: string }> }) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const { className: rawClassName } = await context.params;
  const className = decodeURIComponent(rawClassName) as ClassLevel;

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
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

  // An exam with no real subject reference can't be matched to a teacher's
  // assigned subjects, so it must fail the scope check rather than skip it
  // (assertTeacherScope skips the subject check when given an empty value).
  const scope = await assertTeacherScope(
    guard.session.user.id,
    ctx.subjectId ?? "no-subject",
    className,
  );
  if (!scope.ok) return scope.response;

  const students = await buildStudentScripts(className, ctx);

  return NextResponse.json({
    exam: { id: ctx.examId, title: ctx.title, type: ctx.type },
    students,
  });
}
