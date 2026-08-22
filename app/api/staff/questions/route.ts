import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/lib/models/subject.model";
import "@/lib/models/passage.model";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { Question } from "@/lib/models/question.model";
import { ClassLevel, QuestionType } from "@/lib/models/constants";

// GET /api/staff/questions?type=Objective&subject=<id>&class=JSS1&search=...
// Always scoped to this teacher's own assigned subjects/classes - a
// teacher never sees the full question bank, only the slice that overlaps
// what they've been assigned. Passing a subject/class outside that scope
// is rejected rather than silently ignored, so the UI can surface it.
export async function GET(req: NextRequest) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const params = req.nextUrl.searchParams;
  const type = params.get("type") as QuestionType | null;
  const subject = params.get("subject");
  const classFilter = params.get("class") as ClassLevel | null;
  const search = params.get("search")?.trim();

  const scope = await assertTeacherScope(
    guard.session.user.id,
    subject || undefined,
    classFilter || undefined,
  );
  if (!scope.ok) return scope.response;

  await connectDB();

  const filter: Record<string, unknown> = {
    subject: { $in: scope.staff.assignedSubjects },
    class: { $in: scope.staff.assignedClasses },
  };
  if (type) filter.type = type;
  if (subject) filter.subject = subject;
  if (classFilter) filter.class = classFilter;
  if (search) {
    filter.text = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  const questions = await Question.find(filter)
    .populate("subject", "name code")
    .populate("passageId")
    .sort({ createdAt: -1 });

  return NextResponse.json({ questions });
}

// POST /api/staff/questions
// Body: { text, type, subject, class, marks, options?, correctAnswer? }
// subject+class must be a pair this teacher is actually assigned - a
// teacher assigned Chemistry for SSS1 and Biology for SSS2 cannot add a
// Chemistry/SSS2 question even though each half is individually assigned.
export async function POST(req: NextRequest) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  await connectDB();
  const body = await req.json();

  const scope = await assertTeacherScope(guard.session.user.id, body.subject, body.class);
  if (!scope.ok) return scope.response;

  try {
    const question = await Question.create({
      text: body.text,
      type: body.type,
      subject: body.subject,
      class: body.class,
      marks: body.marks,
      options: body.options,
      correctAnswer: body.correctAnswer,
      passageId: body.passageId,
      passageOrder: body.passageOrder,
      createdBy: guard.session.user.id,
      createdByModel: "Staff",
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create question";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
