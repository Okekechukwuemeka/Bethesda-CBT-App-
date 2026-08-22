import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Question } from "@/lib/models/question.model";
import { Exam, recomputeExamTotals } from "@/lib/models/exam.model";

interface BlockedQuestion {
  questionId: string;
  exams: { id: string; title: string }[];
}

// POST /api/admin/questions/bulk-delete
// Body: { ids: string[], force?: boolean }
// Same "attached to a live exam" protection as DELETE
// /api/admin/questions/[id] - any selected question still attached to an
// exam is refused (and reported per-question) unless force is true, in
// which case it's detached from every exam that uses it and then deleted.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const body = await req.json();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  const force = body.force === true;

  if (ids.length === 0) {
    return NextResponse.json({ error: "No question ids provided" }, { status: 400 });
  }

  const examsUsingAny = await Exam.find({ "questions.question": { $in: ids } });

  if (examsUsingAny.length > 0 && !force) {
    const blockedByQuestion = new Map<string, BlockedQuestion>();
    for (const exam of examsUsingAny) {
      const attachedIds = new Set(exam.questions.map((q) => q.question.toString()));
      for (const id of ids) {
        if (!attachedIds.has(id)) continue;
        if (!blockedByQuestion.has(id)) {
          blockedByQuestion.set(id, { questionId: id, exams: [] });
        }
        blockedByQuestion.get(id)!.exams.push({ id: exam.id, title: exam.title });
      }
    }
    return NextResponse.json(
      {
        error: `${blockedByQuestion.size} of ${ids.length} selected question(s) are attached to one or more exams. Pass force to detach and delete anyway.`,
        blocked: Array.from(blockedByQuestion.values()),
      },
      { status: 409 },
    );
  }

  if (force && examsUsingAny.length > 0) {
    const idSet = new Set(ids);
    await Promise.all(
      examsUsingAny.map(async (exam) => {
        exam.questions = exam.questions.filter(
          (q) => !idSet.has(q.question.toString()),
        ) as typeof exam.questions;
        await exam.save();
        await recomputeExamTotals(exam.id);
      }),
    );
  }

  const result = await Question.deleteMany({ _id: { $in: ids } });
  return NextResponse.json({ deletedCount: result.deletedCount });
}
