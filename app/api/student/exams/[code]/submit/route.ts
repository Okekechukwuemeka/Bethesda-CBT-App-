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

// POST /api/student/exams/[code]/submit
// Body: { submissionId: string; answers?: IncomingAnswer[] }
//
// `answers` is optional and only a safety net - the client should have
// already flushed everything via /sync, but if that last sync failed
// (e.g. connection dropped right as the timer hit zero), this accepts one
// final batch before finalizing.
//
// Idempotent: calling this twice (e.g. an offline-queued submit that
// retries after already succeeding) just returns the existing result
// instead of erroring.
export async function POST(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;
  const { session } = guard;

  const { code } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    submissionId?: string;
    answers?: IncomingAnswer[];
  };

  if (!body.submissionId) {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  await connectDB();

  const exam = await Exam.findOne({ examCode: code.toUpperCase() });
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
    return NextResponse.json({
      alreadySubmitted: true,
      status: submission.status,
      score: submission.score,
      totalMarks: submission.totalMarks,
    });
  }

  if (Array.isArray(body.answers) && body.answers.length > 0) {
    const questionIds = body.answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionById = new Map(questions.map((q) => [q.id, q]));

    for (const incoming of body.answers) {
      const question = questionById.get(incoming.questionId);
      if (!question) continue;

      const existing = submission.answers.find(
        (a) => a.question.toString() === incoming.questionId,
      );
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
  }

  // Fully-objective exams are done grading the moment they're submitted;
  // anything with a theory component waits for a human to mark it.
  submission.status = exam.type === "Objective" ? "Marked" : "Submitted";
  submission.submittedAt = new Date();
  submission.totalMarks = exam.totalMarks;
  if (submission.status === "Marked") {
    submission.markedAt = new Date();
  }

  await submission.save();

  return NextResponse.json({
    submitted: true,
    status: submission.status,
    score: submission.score,
    totalMarks: submission.totalMarks,
  });
}
