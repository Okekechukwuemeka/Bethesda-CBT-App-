import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { Passage } from "@/lib/models/passage.model";
import { Question } from "@/lib/models/question.model";
import { ClassLevel } from "@/lib/models/constants";

// GET /api/staff/passages?subject=<id>&class=JSS1&kind=comprehension
// Always limited to this teacher's assigned subjects/classes - same rule as
// the staff question bank. Passages made by an admin or another teacher in
// that slice are listed too (so the teacher can read them and see what's
// available), but come back with canEdit: false so the UI keeps them view-only.
export async function GET(req: NextRequest) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const params = req.nextUrl.searchParams;
  const subject = params.get("subject");
  const classLevel = params.get("class") as ClassLevel | null;
  const kind = params.get("kind");

  const scope = await assertTeacherScope(
    guard.session.user.id,
    subject || undefined,
    classLevel || undefined,
  );
  if (!scope.ok) return scope.response;

  await connectDB();

  const filter: Record<string, unknown> = {
    subject: subject || { $in: scope.staff.assignedSubjects },
    class: classLevel || { $in: scope.staff.assignedClasses },
  };
  if (kind) filter.kind = kind;

  const passages = await Passage.find(filter).sort({ createdAt: -1 });

  const counts = await Question.aggregate([
    { $match: { passageId: { $in: passages.map((p) => p._id) } } },
    { $group: { _id: "$passageId", count: { $sum: 1 } } },
  ]);
  const countByPassageId = new Map(counts.map((c) => [c._id.toString(), c.count as number]));

  const staffId = guard.session.user.id;
  const result = passages.map((p) => ({
    ...p.toObject(),
    questionCount: countByPassageId.get(p._id.toString()) ?? 0,
    canEdit: p.createdByModel === "Staff" && p.createdBy.toString() === staffId,
  }));

  return NextResponse.json({ passages: result });
}

// POST /api/staff/passages
// Body: { title?, text, kind, subject, class }
// subject+class must be a pair this teacher is assigned to.
export async function POST(req: NextRequest) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  await connectDB();
  const body = await req.json();

  const scope = await assertTeacherScope(guard.session.user.id, body.subject, body.class);
  if (!scope.ok) return scope.response;

  const passage = new Passage({
    title: body.title,
    text: body.text,
    kind: body.kind,
    subject: body.subject,
    class: body.class,
    createdBy: guard.session.user.id,
    createdByModel: "Staff",
  });

  try {
    await passage.validate();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid passage";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await passage.save();

  return NextResponse.json({ passage }, { status: 201 });
}
