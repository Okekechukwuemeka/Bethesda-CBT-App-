import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Submission } from "@/lib/models/submission.model";

function hashToSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// POST /api/student/exams/[examId]/start
// Body: { code?: string }
//
// First call for a given (exam, student) pair MUST include the correct
// access code - that's the actual gate. Every call after that (resuming a
// reload, a re-opened tab, an offline client resyncing) needs no code at
// all: an existing Submission tied to this student + exam is proof enough
// they were already let in once.
export async function POST(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;
  const { session } = guard;

  const { examId } = await context.params;
  await connectDB();

  let exam;
  try {
    exam = await Exam.findById(examId);
  } catch {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }
  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  if (exam.class !== session.user.class) {
    return NextResponse.json(
      { error: "This exam is not available for your class" },
      { status: 403 },
    );
  }

  let submission = await Submission.findOne({ exam: exam._id, student: session.user.id });

  if (submission?.status === "Submitted" || submission?.status === "Marked") {
    return NextResponse.json({ error: "You have already submitted this exam" }, { status: 409 });
  }

  if (!submission) {
    // Not started yet - the access code is required.
    if (!exam.isCodeActive) {
      return NextResponse.json(
        { error: "This exam is not currently accepting the access code" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!code) {
      return NextResponse.json({ error: "Please enter the exam code" }, { status: 400 });
    }
    if (exam.examCode !== code) {
      return NextResponse.json(
        { error: "Invalid exam code. Please check and try again." },
        { status: 400 },
      );
    }

    submission = await Submission.create({
      exam: exam._id,
      student: session.user.id,
      status: "In Progress",
      startedAt: new Date(),
    });
  }

  const populatedExam = await exam.populate({
    path: "questions.question",
    select: "-correctAnswer",
  });
  let orderedRefs = [...populatedExam.questions].sort((a, b) => a.order - b.order);

  if (exam.shuffleQuestions) {
    const seed = hashToSeed(`${exam.id}:${session.user.id}`);
    orderedRefs = seededShuffle(orderedRefs, seed);
  }

  // Merge in whatever's already been answered so a reload/resume restores
  // progress instead of showing a blank exam.
  const answersByQuestion = new Map(submission.answers.map((a) => [a.question.toString(), a]));

  const questions = orderedRefs.map((q, i) => {
    const questionDoc = q.question as unknown as { _id: { toString(): string } };
    const prior = answersByQuestion.get(questionDoc._id.toString());
    return {
      ...(q.question as unknown as Record<string, unknown>),
      order: i,
      selectedOption: prior?.selectedOption,
      textAnswer: prior?.textAnswer,
    };
  });

  const deadline = new Date(
    (submission.startedAt ?? new Date()).getTime() + exam.duration * 60_000,
  );
  const remainingSeconds = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));

  return NextResponse.json({
    exam: {
      id: exam.id,
      title: exam.title,
      type: exam.type,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
    },
    submissionId: submission.id,
    startedAt: submission.startedAt,
    remainingSeconds,
    questions,
  });
}
