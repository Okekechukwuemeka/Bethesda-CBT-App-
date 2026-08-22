import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireTeacher } from "@/lib/api-guards";
import { Staff } from "@/lib/models/staff.model";
import { Student } from "@/lib/models/student.model";
import { Exam, examClassFilter } from "@/lib/models/exam.model";
import type { ClassResult } from "@/types/admin-results";

// GET /api/staff/results/classes
// Same shape as GET /api/admin/results/classes, but only this teacher's
// assigned classes - mirrors the admin "pick a class" landing page.
export async function GET() {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  await connectDB();
  const staff = await Staff.findById(guard.session.user.id);
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  const results: ClassResult[] = [];

  for (const className of staff.assignedClasses) {
    const studentCount = await Student.countDocuments({ class: className, isActive: true });
    if (studentCount === 0) continue;

    const totalExams = await Exam.countDocuments({
      ...examClassFilter(className),
      subject: { $in: staff.assignedSubjects },
    });

    results.push({ className, studentCount, totalExams });
  }

  return NextResponse.json({ classes: results });
}
