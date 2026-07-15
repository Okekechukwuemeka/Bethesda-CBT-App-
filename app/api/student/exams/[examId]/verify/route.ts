import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";

// POST /api/student/exams/[examId]/verify
// Body: { code: string }
//
// Deliberately separate from GET /api/student/exams/[code], which actually
// creates the Submission and starts the attempt. This endpoint only checks
// the code is right for *this* exam and *this* student's class, so a wrong
// guess doesn't spin up a submission or leak whether other codes exist.
export async function POST(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;
  const { session } = guard;

  const { examId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

  if (!code) {
    return NextResponse.json({ error: "Please enter the exam code" }, { status: 400 });
  }

  await connectDB();

  let exam;
  try {
    exam = await Exam.findOne({ _id: examId, class: session.user.class });
  } catch {
    // Malformed ObjectId
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  if (!exam.isCodeActive) {
    return NextResponse.json(
      { error: "This exam is not currently accepting the access code" },
      { status: 403 },
    );
  }

  if (exam.examCode !== code) {
    return NextResponse.json(
      { error: "Invalid exam code. Please check and try again." },
      { status: 400 },
    );
  }

  return NextResponse.json({ valid: true, code: exam.examCode });
}
