import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Student } from "@/lib/models/student.model";
import { Exam } from "@/lib/models/exam.model";
import { Submission } from "@/lib/models/submission.model";
import { CLASS_LEVELS } from "@/lib/models/constants";
import type { ClassResult, Performance } from "@/types/admin-results";

// Thresholds are a reasonable default (>=75 excellent, >=60 good, >=45
// average, below that poor) - adjust to match the school's actual grading
// scale if this doesn't line up with their existing bands.
function bucketPerformance(avg: number): Performance {
  if (avg >= 75) return "excellent";
  if (avg >= 60) return "good";
  if (avg >= 45) return "average";
  return "poor";
}

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

    const classExams = await Exam.find({ class: className }).select("_id");
    const classExamIds = classExams.map((e) => e._id);

    // This average is a straight mean across every marked submission in
    // the class (a "micro-average"), not an average of each subject's own
    // average - a class with one huge subject and one tiny one shouldn't
    // have the tiny one silently pull the headline number as hard as the
    // big one.
    const markedSubmissions = await Submission.find({
      exam: { $in: classExamIds },
      status: "Marked",
    }).select("score totalMarks");

    const percentages = markedSubmissions
      .filter((s) => s.totalMarks > 0)
      .map((s) => (s.score / s.totalMarks) * 100);

    const averageScore =
      percentages.length > 0
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : 0;

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
