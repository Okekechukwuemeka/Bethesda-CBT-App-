import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { Question } from "@/lib/models/question.model";
import { Exam, recomputeExamTotals } from "@/lib/models/exam.model";

interface BlockedQuestion {
  questionId: string;
  exams: { id: string; title: string }[];
}

// POST /api/staff/questions/bulk-delete
// Body: { ids: string[], force?: boolean }
// Teacher counterpart of /api/admin/questions/bulk-delete, with the same rules
// as the single DELETE /api/staff/questions/[id]:
//  - a teacher can only delete questions they created themselves, and only
//    while the question's subject + class is still inside their assignment.
//    Any other id in the request is left alone and counted in `skipped`.
//  - a question still attached to an exam is refused (409, reported per
//    question) unless force is true, in which case it is detached from every
//    exam that uses it and then deleted.
export async function POST(req: NextRequest) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const requestedIds: string[] = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.filter((id: unknown): id is string => typeof id === "string")))
    : [];
  const force = body.force === true;

  if (requestedIds.length === 0) {
    return NextResponse.json({ error: "No question ids provided" }, { status: 400 });
  }

  const staffId = guard.session.user.id;
  const scope = await assertTeacherScope(staffId);
  if (!scope.ok) return scope.response;

  await connectDB();

  let owned;
  try {
    owned = await Question.find({
      _id: { $in: requestedIds },
      createdByModel: "Staff",
      createdBy: staffId,
      subject: { $in: scope.staff.assignedSubjects },
      class: { $in: scope.staff.assignedClasses },
    }).select("_id");
  } catch {
    return NextResponse.json({ error: "One or more question ids are invalid" }, { status: 400 });
  }

  const ids = owned.map((q) => q.id as string);
  const skipped = requestedIds.length - ids.length;

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "None of the selected questions can be deleted by you." },
      { status: 403 },
    );
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
        skipped,
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
  return NextResponse.json({ deletedCount: result.deletedCount, skipped });
}
