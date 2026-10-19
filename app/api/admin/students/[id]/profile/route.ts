import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import {
  findStudentById,
  loadStudentRecords,
  loadUpcomingExams,
  toStudentInfo,
} from "@/lib/student-profile";
import type { StudentProfileResponse } from "@/types/student-profile";

// GET /api/admin/students/[id]/profile
//
// One student's information, examination history (grouped by term, with the
// marking state of each) and upcoming exams - all computed from the database on
// each request. Admin only: this is sensitive student data.
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const student = await findStudentById(id);
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const [records, upcoming] = await Promise.all([
    loadStudentRecords(String(student._id)),
    loadUpcomingExams(student),
  ]);

  const body: StudentProfileResponse = {
    student: toStudentInfo(student),
    summary: records.summary,
    examinations: records.groups.map((g) => g.summary),
    upcoming,
  };
  return NextResponse.json(body);
}
