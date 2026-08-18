import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Submission } from "@/lib/models/submission.model";
// Side-effect import: guarantees the "Passage" model is registered before
// we populate it below. Nothing else in this file references Passage
// directly.
import "@/lib/models/passage.model";

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

  // A class-specific exam must match the student's class exactly; a
  // general exam (isGeneral: true) is eligible if the student's class is
  // among exam.classes - mirrors examClassFilter's $or logic, just
  // evaluated in-memory here since we already have the loaded document.
  const isEligible = exam.isGeneral
    ? (exam.classes ?? []).includes(session.user.class)
    : exam.class === session.user.class;

  if (!isEligible) {
    return NextResponse.json(
      { error: "This exam is not available for your class" },
      { status: 403 },
    );
  }

  if (Date.now() < new Date(exam.examDate).getTime()) {
    return NextResponse.json(
      {
        error: `This exam opens on ${new Date(exam.examDate).toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
      },
      { status: 403 },
    );
  }

  let submission = await Submission.findOne({ exam: exam._id, student: session.user.id });

  if (submission?.status === "Submitted" || submission?.status === "Marked") {
    return NextResponse.json({ error: "You have already submitted this exam" }, { status: 409 });
  }

  if (!submission) {
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

  // Populate the question's passageId too, not just the question itself -
  // this is what was missing before: passage text/kind never reached the
  // client, so a comprehension group rendered as isolated questions with
  // no shared context.
  const populatedExam = await exam.populate({
    path: "questions.question",
    select: "-correctAnswer",
    populate: { path: "passageId" },
  });

  const examObj = populatedExam.toObject() as unknown as {
    questions: {
      question: Record<string, unknown> & {
        _id: { toString(): string };
        passageId?: { _id: { toString(): string }; title?: string; text: string; kind: string };
        passageOrder?: number;
      };
      order: number;
    }[];
  };

  let orderedRefs = [...examObj.questions].sort((a, b) => a.order - b.order);

  if (exam.shuffleQuestions) {
    // Group by passageId, not individual question, so a comprehension
    // passage's (or any other passage kind's) sub-questions are always
    // shuffled as ONE unit relative to other groups/standalone questions -
    // never split apart or reordered relative to each other. A question
    // with no passageId is its own singleton group, so ordinary
    // standalone questions still shuffle freely among themselves.
    const groups = new Map<string, typeof orderedRefs>();
    for (const ref of orderedRefs) {
      const key =
        ref.question.passageId?._id?.toString() ?? `__singleton_${ref.question._id.toString()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ref);
    }
    // Within a passage group, order by passageOrder (the sequence the
    // admin authored the sub-questions in), not the exam's own
    // attach-order - keeps e.g. Q1/Q2/Q3 of a comprehension in sequence.
    for (const group of groups.values()) {
      group.sort((a, b) => (a.question.passageOrder ?? 0) - (b.question.passageOrder ?? 0));
    }

    const seed = hashToSeed(`${exam.id}:${session.user.id}`);
    const shuffledGroups = seededShuffle([...groups.values()], seed);
    orderedRefs = shuffledGroups.flat();
  }

  const answersByQuestion = new Map(submission.answers.map((a) => [a.question.toString(), a]));

  const questions = orderedRefs.map((q, i) => {
    const qId = q.question._id.toString();
    const prior = answersByQuestion.get(qId);
    const { passageId, passageOrder, ...questionFields } = q.question;

    return {
      ...questionFields,
      _id: qId,
      order: i,
      selectedOption: prior?.selectedOption,
      textAnswer: prior?.textAnswer,
      passageId: passageId?._id?.toString(),
      passageTitle: passageId?.title,
      passageText: passageId?.text,
      passageKind: passageId?.kind,
      // This was being computed above (to exclude it from the spread)
      // and then silently never added back - without it, a passage's
      // sub-questions had no reliable way to know their own position
      // within the group (1st, 2nd, 3rd...), only whatever order they
      // happened to land in after shuffling.
      passageOrder,
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
      instructions: exam.instructions,
    },
    submissionId: submission.id,
    startedAt: submission.startedAt,
    remainingSeconds,
    questions,
  });
}
