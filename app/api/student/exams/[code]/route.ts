import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Submission } from "@/lib/models/submission.model";

// GET /api/student/exams/[code]
export async function GET(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;
  const { session } = guard;

  const { code } = await context.params;
  await connectDB();

  const exam = await Exam.findOne({ examCode: code.toUpperCase(), isCodeActive: true });
  if (!exam) {
    return NextResponse.json({ error: "Invalid or inactive exam code" }, { status: 404 });
  }

  // A student can only sit exams set for their own class.
  if (exam.class !== session.user.class) {
    return NextResponse.json(
      { error: "This exam is not available for your class" },
      { status: 403 },
    );
  }

  // Reuse an in-progress attempt instead of creating duplicates - the
  // unique {exam, student} index on Submission would reject a second one
  // anyway, but this gives a clean "already started" response instead of
  // a raw duplicate-key error.
  let submission = await Submission.findOne({ exam: exam._id, student: session.user.id });
  if (submission?.status === "Submitted" || submission?.status === "Marked") {
    return NextResponse.json({ error: "You have already submitted this exam" }, { status: 409 });
  }
  if (!submission) {
    submission = await Submission.create({
      exam: exam._id,
      student: session.user.id,
      status: "In Progress",
      startedAt: new Date(),
    });
  }

  // Pull the attached bank questions in this exam's order, stripping
  // correctAnswer before it ever reaches the client for an active attempt.
  const populatedExam = await exam.populate({
    path: "questions.question",
    select: "-correctAnswer",
  });

  // .populate() returns Mongoose Document instances, not plain objects -
  // spreading a Document directly pulls in its internal machinery ($__,
  // _doc, isNew, etc.) instead of its actual fields. .toObject() converts
  // it to a clean plain object first, so the response only contains real
  // question data (_id, text, options, marks, ...) plus the exam-specific
  // `order` field.
  const questions = [...populatedExam.questions]
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const question = q.question as unknown as { toObject: () => Record<string, unknown> };
      return { ...question.toObject(), order: q.order };
    });

  return NextResponse.json({
    exam: {
      id: exam.id,
      title: exam.title,
      type: exam.type,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
    },
    submissionId: submission.id,
    questions,
  });
}
