import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam, recomputeExamTotals } from "@/lib/models/exam.model";
import { Question, IQuestion } from "@/lib/models/question.model";

// GET /api/admin/exams/[examId]/questions
// Returns this exam's attached questions, in this exam's order - pulled
// from the bank via the ids stored on Exam.questions.
export async function GET(_req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  await connectDB();

  const exam = await Exam.findById(examId).populate("questions.question");
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const questions = [...exam.questions]
    .filter((q) => q.question) // guards against a deleted/orphaned question ref
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const question = q.question as unknown as { toObject?: () => Record<string, unknown> };
      const plain = typeof question.toObject === "function" ? question.toObject() : question;
      return { ...plain, order: q.order };
    });

  return NextResponse.json({ questions });
}

interface NewQuestionInput {
  text?: string;
  type?: string;
  marks?: number;
  options?: string[];
  correctAnswer?: string;
  // Optional passage link, passed straight through to Question - both
  // travel together (see the passageId/passageOrder pre-validate check on
  // the Question model), so it's fine to pass one without the other here;
  // the model will reject it if the caller got that wrong.
  passageId?: string;
  passageOrder?: number;
}

interface ItemError {
  index: number;
  error: string;
}

// POST /api/admin/exams/[examId]/questions
// Body: {
//   questionIds?: string[];          // attach EXISTING bank questions
//   newQuestions?: NewQuestionInput[]; // create NEW bank questions (tagged
//                                      // with this exam's subject/class)
//                                      // and attach them, in one call
// }
// Both can be sent together. Either way, every question that ends up
// attached is (or becomes) a real bank entry - this route never creates a
// question that only exists "inside" an exam.
export async function POST(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  await connectDB();

  const exam = await Exam.findById(examId);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const body = (await req.json()) as {
    questionIds?: string[];
    newQuestions?: NewQuestionInput[];
  };
  const requestedIds = body.questionIds ?? [];
  const newQuestionInputs = body.newQuestions ?? [];

  if (requestedIds.length === 0 && newQuestionInputs.length === 0) {
    return NextResponse.json(
      { error: "Provide questionIds and/or newQuestions - both were empty" },
      { status: 400 },
    );
  }

  // --- Validate existing-id attachments -----------------------------
  let existingQuestions: IQuestion[] = [];
  if (requestedIds.length > 0) {
    existingQuestions = await Question.find({ _id: { $in: requestedIds } });
    const foundIds = new Set(
      existingQuestions.map((q) => (q._id as mongoose.Types.ObjectId).toString()),
    );
    const missing = requestedIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Some question ids don't exist in the bank", missing },
        { status: 400 },
      );
    }
  }

  // --- Validate new questions up front, before writing anything ------
  const candidates: IQuestion[] = newQuestionInputs.map(
    (input) =>
      new Question({
        text: input.text,
        type: input.type,
        marks: input.marks,
        options: input.options,
        correctAnswer: input.correctAnswer,
        passageId: input.passageId,
        passageOrder: input.passageOrder,
        // Inherited from the exam - a question created this way is scoped
        // to the same subject/class as the exam it was born in.
        subject: exam.subject,
        class: exam.class,
        createdBy: guard.session.user.id,
      }),
  );

  const errors: ItemError[] = [];
  const validations = await Promise.allSettled(candidates.map((q) => q.validate()));
  validations.forEach((result, i) => {
    if (result.status === "rejected") {
      const message = result.reason instanceof Error ? result.reason.message : "Invalid question";
      errors.push({ index: i, error: message });
    }
  });

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "One or more new questions are invalid, nothing was attached", itemErrors: errors },
      { status: 400 },
    );
  }

  if (candidates.length > 0) {
    await Question.insertMany(candidates);
  }

  // --- Attach everything (existing + newly created) -------------------
  const allToAttach: IQuestion[] = [...existingQuestions, ...candidates];
  const alreadyAttached = new Set(exam.questions.map((q) => q.question.toString()));
  let nextOrder = exam.questions.length;
  let added = 0;

  for (const question of allToAttach) {
    const id = (question._id as mongoose.Types.ObjectId).toString();
    if (alreadyAttached.has(id)) continue; // skip duplicates, not an error
    exam.questions.push({
      question: question._id as unknown as mongoose.Types.ObjectId,
      order: nextOrder,
    });
    alreadyAttached.add(id);
    nextOrder += 1;
    added += 1;
  }

  await exam.save();
  await recomputeExamTotals(exam.id);

  return NextResponse.json({
    attached: added,
    created: candidates.length,
    totalQuestions: exam.questions.length,
  });
}
