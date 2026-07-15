import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Question } from "@/lib/models/question.model";
import { Submission, IAnswerRecord } from "@/lib/models/submission.model";

interface IncomingAnswer {
  questionId: string;
  selectedOption?: string;
  textAnswer?: string;
  updatedAt?: number;
}

// PATCH /api/student/exams/[examId]/sync
// Body: { submissionId: string; answers: IncomingAnswer[] }
export async function PATCH(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;
  const { session } = guard;

  const { examId } = await context.params;
  const body = (await req.json()) as { submissionId?: string; answers?: IncomingAnswer[] };

  if (!body.submissionId || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "submissionId and answers are required" }, { status: 400 });
  }

  await connectDB();

  const exam = await Exam.findById(examId);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const submission = await Submission.findOne({
    _id: body.submissionId,
    exam: exam._id,
    student: session.user.id,
  });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  if (submission.status === "Submitted" || submission.status === "Marked") {
    return NextResponse.json(
      { error: "This exam has already been submitted, no further changes accepted" },
      { status: 409 },
    );
  }

  const startedAt = submission.startedAt ?? new Date();
  const deadline = new Date(startedAt.getTime() + exam.duration * 60_000);
  if (new Date() > deadline) {
    return NextResponse.json(
      { error: "Time is up for this exam, please submit", expired: true },
      { status: 409 },
    );
  }

  const questionIds = body.answers.map((a) => a.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });
  const questionById = new Map(questions.map((q) => [q.id, q]));

  for (const incoming of body.answers) {
    const question = questionById.get(incoming.questionId);
    if (!question) continue;

    const existing = submission.answers.find((a) => a.question.toString() === incoming.questionId);

    if (existing?.updatedAt && incoming.updatedAt && existing.updatedAt > incoming.updatedAt) {
      continue;
    }

    const record: IAnswerRecord = {
      question: question._id as IAnswerRecord["question"],
      selectedOption: incoming.selectedOption,
      textAnswer: incoming.textAnswer,
      updatedAt: incoming.updatedAt ?? Date.now(),
    };

    if (question.type === "Objective") {
      record.isCorrect = incoming.selectedOption === question.correctAnswer;
      record.marksAwarded = record.isCorrect ? question.marks : 0;
    }

    if (existing) {
      Object.assign(existing, record);
    } else {
      submission.answers.push(record);
    }
  }

  if (submission.status === "Not Started") {
    submission.status = "In Progress";
  }
  submission.lastSyncedAt = new Date();

  await submission.save();

  return NextResponse.json({
    synced: true,
    serverTime: Date.now(),
    remainingSeconds: Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000)),
  });
}
