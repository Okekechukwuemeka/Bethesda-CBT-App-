import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Student } from "@/lib/models/student.model";
import { Exam } from "@/lib/models/exam.model";
import { CLASS_LEVELS } from "@/lib/models/constants";
import { bucketPerformance, getClassAverageScore } from "@/lib/results-helpers";
import type { ClassResult } from "@/types/admin-results";

// GET /api/admin/results/classes
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();

  const results: ClassResult[] = [];

  // "graduated" isn't a class you'd ever have exam results for.
  const teachableClasses = CLASS_LEVELS.filter((level) => level !== "graduated");

  for (const className of teachableClasses) {
    const studentCount = await Student.countDocuments({ class: className, isActive: true });
    if (studentCount === 0) continue; // nothing to show for a class with no active students

    const completedExams = await Exam.countDocuments({ class: className, status: "Completed" });
    const averageScore = await getClassAverageScore(className);

    results.push({
      className,
      studentCount,
      completedExams,
      averageScore,
      performance: bucketPerformance(averageScore),
    });
  }

  return NextResponse.json({ classes: results });
}
