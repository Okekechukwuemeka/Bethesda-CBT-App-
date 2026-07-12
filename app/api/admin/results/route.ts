import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { ClassLevel, ExamType } from "@/lib/models/constants";
import { Exam } from "@/lib/models/exam.model";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";

// GET /api/admin/results?class=JSS1&type=Objective
//
// Returns one row per exam - avg/high/low score, how many students have
// completed it vs the class size, and a rolled-up status - mirroring the
// admin Results page. This is intentionally exam-level aggregation, not a
// raw dump of Submission documents; if you need the raw per-student rows
// for one exam (e.g. the "Student Scripts" modal), that's a separate,
// simpler query: Submission.find({ exam: examId }).
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const params = req.nextUrl.searchParams;
  const classFilter = params.get("class") as ClassLevel | null;
  const typeFilter = params.get("type") as ExamType | null;

  const examFilter: Record<string, unknown> = {};
  if (classFilter) examFilter.class = classFilter;
  if (typeFilter) examFilter.type = typeFilter;

  const exams = await Exam.find(examFilter).populate("subject", "name code").lean();

  // Class sizes are looked up once and reused across exams in the same
  // class, rather than re-querying per exam.
  const classSizeCache = new Map<string, number>();
  async function getClassSize(classLevel: string): Promise<number> {
    if (!classSizeCache.has(classLevel)) {
      const filter: { class?: ClassLevel; isActive?: boolean } = {};
      filter.class = classLevel as ClassLevel;
      filter.isActive = true;
      const count = await Student.find(filter).countDocuments();
      classSizeCache.set(classLevel, count);
    }
    return classSizeCache.get(classLevel) as number;
  }

  const results = await Promise.all(
    exams.map(async (exam) => {
      const submissions = await Submission.find({ exam: exam._id }).select("status score");

      const graded = submissions.filter((s) => s.status === "Marked" || s.status === "Submitted");
      const scores = graded.map((s) => s.score);
      const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const highScore = scores.length ? Math.max(...scores) : 0;
      const lowScore = scores.length ? Math.min(...scores) : 0;
      const markedCount = submissions.filter((s) => s.status === "Marked").length;

      const totalStudents = await getClassSize(exam.class);

      let status: "Pending" | "In Progress" | "Completed";
      if (totalStudents > 0 && markedCount >= totalStudents) status = "Completed";
      else if (markedCount > 0 || submissions.length > 0) status = "In Progress";
      else status = "Pending";

      return {
        examId: exam._id,
        title: exam.title,
        subject: exam.subject,
        class: exam.class,
        term: exam.term,
        type: exam.type,
        totalMarks: exam.totalMarks,
        avgScorePercent: exam.totalMarks > 0 ? Math.round((avgScore / exam.totalMarks) * 100) : 0,
        highScore,
        lowScore,
        completedCount: markedCount,
        totalStudents,
        status,
      };
    }),
  );

  return NextResponse.json({ results });
}
