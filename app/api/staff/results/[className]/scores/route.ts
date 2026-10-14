import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import {
  applyTheoryScores,
  buildStudentScripts,
  loadExamResultsContext,
} from "@/lib/results-helpers";
import type { ClassLevel } from "@/lib/models/constants";
import type { SaveTheoryScoresResponse, TheoryScoreEntry } from "@/types/admin-results";

const MAX_ENTRIES = 500;

// PUT /api/staff/results/[className]/scores
// Body: { examId: string; scores: { studentId: string; theoryScore: number | null }[] }
//
// Same as the admin route, but a teacher can only enter marks for an exam in
// a subject AND class they have been assigned (the same check the staff
// "students" route uses to decide who may see the scripts).
export async function PUT(req: NextRequest, context: { params: Promise<{ className: string }> }) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const { className: rawClassName } = await context.params;
  const className = decodeURIComponent(rawClassName) as ClassLevel;

  const body = (await req.json().catch(() => ({}))) as {
    examId?: unknown;
    scores?: unknown;
  };

  if (typeof body.examId !== "string" || !mongoose.Types.ObjectId.isValid(body.examId)) {
    return NextResponse.json({ error: "A valid examId is required" }, { status: 400 });
  }
  if (!Array.isArray(body.scores) || body.scores.length === 0) {
    return NextResponse.json({ error: "No scores were sent" }, { status: 400 });
  }
  if (body.scores.length > MAX_ENTRIES) {
    return NextResponse.json({ error: "Too many scores in one request" }, { status: 400 });
  }

  const entries: TheoryScoreEntry[] = [];
  for (const raw of body.scores as { studentId?: unknown; theoryScore?: unknown }[]) {
    if (typeof raw?.studentId !== "string" || !mongoose.Types.ObjectId.isValid(raw.studentId)) {
      return NextResponse.json({ error: "Every score needs a valid studentId" }, { status: 400 });
    }
    if (raw.theoryScore !== null && typeof raw.theoryScore !== "number") {
      return NextResponse.json(
        { error: "theoryScore must be a number (or null to remove it)" },
        { status: 400 },
      );
    }
    entries.push({ studentId: raw.studentId, theoryScore: raw.theoryScore });
  }

  await connectDB();

  const ctx = await loadExamResultsContext(body.examId);
  if (!ctx) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  // An exam with no real subject reference can't be matched to a teacher's
  // assigned subjects, so it must fail the scope check rather than skip it.
  const scope = await assertTeacherScope(
    guard.session.user.id,
    ctx.subjectId ?? "no-subject",
    className,
  );
  if (!scope.ok) return scope.response;

  if (ctx.type === "Objective") {
    return NextResponse.json(
      { error: "Objective exams are marked automatically - there is no theory score to enter." },
      { status: 400 },
    );
  }

  const { savedCount, failures } = await applyTheoryScores(className, ctx, entries, {
    id: guard.session.user.id,
    role: "staff",
  });
  const students = await buildStudentScripts(className, ctx);

  const response: SaveTheoryScoresResponse = { savedCount, failures, students };
  return NextResponse.json(response);
}
