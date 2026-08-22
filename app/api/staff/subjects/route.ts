import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireTeacher } from "@/lib/api-guards";
import { Staff } from "@/lib/models/staff.model";

// GET /api/staff/subjects
// Only this teacher's assigned subjects - populates the subject dropdown
// on the question form and results page, deliberately narrower than
// GET /api/admin/subjects.
export async function GET() {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  await connectDB();
  const staff = await Staff.findById(guard.session.user.id).populate(
    "assignedSubjects",
    "name code",
  );
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  return NextResponse.json({ subjects: staff.assignedSubjects, classes: staff.assignedClasses });
}
