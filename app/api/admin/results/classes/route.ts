import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Student } from "@/lib/models/student.model";
import { Exam, examClassFilter } from "@/lib/models/exam.model";
import { CLASS_LEVELS } from "@/lib/models/constants";
import type { ClassResult } from "@/types/admin-results";

// GET /api/admin/results/classes
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();

  const results: ClassResult[] = [];
  const teachableClasses = CLASS_LEVELS.filter((level) => level !== "graduated");

  for (const className of teachableClasses) {
    const studentCount = await Student.countDocuments({ class: className, isActive: true });
    if (studentCount === 0) continue;

    // Total exams ever created for this class, regardless of status -
    // previously this only counted status: "Completed", which is a state
    // nothing in the app ever actually sets, so it always read 0 even
    // with real exams scheduled/ongoing for the class. Includes general
    // exams this class is eligible for, not just class-specific ones.
    const totalExams = await Exam.countDocuments(examClassFilter(className));

    results.push({ className, studentCount, totalExams });
  }

  return NextResponse.json({ classes: results });
}
