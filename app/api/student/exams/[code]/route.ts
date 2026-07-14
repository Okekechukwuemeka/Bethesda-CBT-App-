import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Submission } from "@/lib/models/submission.model";

// Deterministic string hash -> 32-bit seed, then a small seeded PRNG
// (mulberry32). Deliberately NOT Math.random(): the shuffle needs to be
// stable for a given (exam, student) pair - re-fetching the exam (tab
// reopened, offline client resyncing) must return questions in the exact
// same order every time, or the student's IndexedDB-cached order and the
// server's order would drift apart. Seeding from examId+studentId gives
// each student their own fixed shuffle without storing anything extra.
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
      {
        status: 403,
      },
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
  let orderedRefs = [...populatedExam.questions].sort((a, b) => a.order - b.order);

  if (exam.shuffleQuestions) {
    const seed = hashToSeed(`${exam.id}:${session.user.id}`);
    orderedRefs = seededShuffle(orderedRefs, seed);
  }

  const questions = orderedRefs.map((q, i) => ({
    ...(q.question as unknown as Record<string, unknown>),
    // `order` here reflects what's actually being SHOWN to this student
    // (post-shuffle), not the exam's canonical/admin-defined order - the
    // client should trust this field for display sequencing.
    order: i,
  }));

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
