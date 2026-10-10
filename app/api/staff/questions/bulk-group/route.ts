import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { Question } from "@/lib/models/question.model";
import { buildQuestionFilter } from "@/lib/question-filter";
import { normalizeGroupName, resolveGroupName, validateGroupName } from "@/lib/question-groups";
import type { ClassLevel } from "@/lib/models/constants";

// POST /api/staff/questions/bulk-group
// Body: { group: string, filter: { type?, subject?, class?, search?, group? } }
// Moves the teacher's OWN questions that match the list filters into a group.
// Mirrors the single-question rules (PATCH /api/staff/questions/[id]): only
// questions this teacher created, and only inside their current assignment -
// other teachers' questions that happen to match are left alone and reported
// back as `skipped` so the screen can say so.
export async function POST(req: NextRequest) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const group = normalizeGroupName(body.group);
  const groupError = validateGroupName(group);
  if (groupError) return NextResponse.json({ error: groupError }, { status: 400 });

  const params = new URLSearchParams();
  if (body.filter && typeof body.filter === "object") {
    for (const [key, value] of Object.entries(body.filter)) {
      if (typeof value === "string" && value) params.set(key, value);
    }
  }

  const scope = await assertTeacherScope(
    guard.session.user.id,
    params.get("subject") || undefined,
    (params.get("class") as ClassLevel | null) || undefined,
  );
  if (!scope.ok) return scope.response;

  await connectDB();

  const inScope = buildQuestionFilter(params, {
    subject: { $in: scope.staff.assignedSubjects },
    class: { $in: scope.staff.assignedClasses },
  });
  const mine = { $and: [inScope, { createdByModel: "Staff", createdBy: guard.session.user.id }] };

  const [matchedInScope, resolved] = await Promise.all([
    Question.countDocuments(inScope),
    resolveGroupName(group),
  ]);
  const result = await Question.updateMany(mine, { $set: { group: resolved } }, { timestamps: false });

  return NextResponse.json({
    updated: result.modifiedCount,
    matched: result.matchedCount,
    skipped: Math.max(0, matchedInScope - result.matchedCount),
    group: resolved,
  });
}
