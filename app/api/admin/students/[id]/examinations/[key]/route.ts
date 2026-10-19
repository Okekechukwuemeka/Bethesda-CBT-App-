import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import {
  findStudentById,
  isExaminationKey,
  loadStudentRecords,
  toStudentInfo,
} from "@/lib/student-profile";
import type { ExaminationDetailResponse } from "@/types/student-profile";

// GET /api/admin/students/[id]/examinations/[key]
//
// The detail of ONE examination for ONE student: every paper (subject) they
// took, with its score or its marking state - including which essay sections
// are still waiting to be marked. Admin only.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string; key: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id, key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);
  if (!isExaminationKey(key)) {
    return NextResponse.json({ error: "Examination not found" }, { status: 404 });
  }

  const student = await findStudentById(id);
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const { groups } = await loadStudentRecords(String(student._id));
  const group = groups.find((g) => g.summary.key === key);
  if (!group) {
    return NextResponse.json(
      { error: "This student has no results for that examination" },
      { status: 404 },
    );
  }

  const info = toStudentInfo(student);
  const body: ExaminationDetailResponse = {
    student: {
      id: info.id,
      fullName: info.fullName,
      admissionNumber: info.admissionNumber,
      class: info.class,
    },
    examination: group.summary,
    papers: group.papers,
  };
  return NextResponse.json(body);
}
