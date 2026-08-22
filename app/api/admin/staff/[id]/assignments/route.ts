import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Staff } from "@/lib/models/staff.model";
import { Subject } from "@/lib/models/subject.model";
import { CLASS_LEVELS, ClassLevel } from "@/lib/models/constants";

// PATCH /api/admin/staff/[id]/assignments
// Body: { addSubjects?: string[], removeSubjects?: string[],
//         addClasses?: ClassLevel[], removeClasses?: ClassLevel[] }
// Additions and removals can be combined in one call. Only meaningful for
// staff whose role is "teacher" - see Staff.pre("validate") which clears
// assignments outright for non-teaching staff.
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  await connectDB();
  const body = await req.json();

  const staff = await Staff.findById(id);
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  if (staff.role !== "teacher") {
    return NextResponse.json(
      { error: "Only staff with the teacher role can be assigned subjects or classes" },
      { status: 400 },
    );
  }

  const addSubjects: string[] = Array.isArray(body.addSubjects) ? body.addSubjects : [];
  const removeSubjects: string[] = Array.isArray(body.removeSubjects) ? body.removeSubjects : [];
  const addClasses: ClassLevel[] = Array.isArray(body.addClasses) ? body.addClasses : [];
  const removeClasses: ClassLevel[] = Array.isArray(body.removeClasses) ? body.removeClasses : [];

  if (addClasses.some((c) => !(CLASS_LEVELS as readonly string[]).includes(c))) {
    return NextResponse.json({ error: "One or more class levels are invalid" }, { status: 400 });
  }

  if (addSubjects.length > 0) {
    const existing = await Subject.countDocuments({ _id: { $in: addSubjects } });
    if (existing !== addSubjects.length) {
      return NextResponse.json(
        { error: "One or more subjects could not be found" },
        { status: 400 },
      );
    }
  }

  const currentSubjectIds = new Set(staff.assignedSubjects.map((s) => s.toString()));
  addSubjects.forEach((s) => currentSubjectIds.add(s));
  removeSubjects.forEach((s) => currentSubjectIds.delete(s));
  staff.assignedSubjects = Array.from(currentSubjectIds) as unknown as typeof staff.assignedSubjects;

  const currentClasses = new Set(staff.assignedClasses);
  addClasses.forEach((c) => currentClasses.add(c));
  removeClasses.forEach((c) => currentClasses.delete(c));
  staff.assignedClasses = Array.from(currentClasses);

  await staff.save();
  await staff.populate("assignedSubjects", "name code");

  return NextResponse.json({ staff });
}
