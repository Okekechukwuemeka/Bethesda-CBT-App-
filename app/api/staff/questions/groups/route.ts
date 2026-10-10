import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { listQuestionGroups, toObjectIds } from "@/lib/question-groups";
import type { ClassLevel } from "@/lib/models/constants";

// GET /api/staff/questions/groups?subject=<id>&class=JSS1
// Same as the admin route, but only counts questions inside this teacher's
// assigned subjects/classes - a teacher never learns about (or sees counts
// for) groups that only exist outside their assignment.
export async function GET(req: NextRequest) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const params = req.nextUrl.searchParams;
  const subject = params.get("subject");
  const classFilter = params.get("class") as ClassLevel | null;

  if (subject && !mongoose.Types.ObjectId.isValid(subject)) {
    return NextResponse.json({ error: "Invalid subject filter" }, { status: 400 });
  }

  const scope = await assertTeacherScope(
    guard.session.user.id,
    subject || undefined,
    classFilter || undefined,
  );
  if (!scope.ok) return scope.response;

  await connectDB();

  const match: Record<string, unknown> = {
    subject: { $in: toObjectIds(scope.staff.assignedSubjects) },
    class: { $in: scope.staff.assignedClasses },
  };
  if (subject) match.subject = new mongoose.Types.ObjectId(subject);
  if (classFilter) match.class = classFilter;

  return NextResponse.json(await listQuestionGroups(match));
}
