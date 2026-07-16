import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";

// GET /api/admin/dashboard/summary
// Single aggregated payload for the dashboard's Overview/Exams/Students
// tabs, replacing the old client-side join of 4 separate endpoints (which
// included a now-deleted route). Submissions/activity still come from the
// existing /api/admin/activity endpoint separately.
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();

  const [exams, students] = await Promise.all([
    Exam.find().populate("subject", "name").sort({ examDate: -1 }).lean(),
    Student.find().lean(),
  ]);

  // One query for completion counts across every exam, grouped by exam id,
  // instead of N queries (one per exam) - matters once there are dozens
  // of exams on the dashboard.
  const completionAgg = await Submission.aggregate([
    { $match: { status: "Marked" } },
    { $group: { _id: "$exam", completedCount: { $sum: 1 } } },
  ]);
  const completedByExamId = new Map(
    completionAgg.map((row) => [row._id.toString(), row.completedCount as number]),
  );

  const classSizeCache = new Map<string, number>();
  function classSize(className: string): number {
    if (!classSizeCache.has(className)) {
      const count = students.filter((s) => s.class === className && s.isActive).length;
      classSizeCache.set(className, count);
    }
    return classSizeCache.get(className) as number;
  }

  const examRows = exams.map((exam) => {
    const totalStudents = classSize(exam.class);
    const completedCount = completedByExamId.get(exam._id.toString()) ?? 0;
    return {
      id: exam._id.toString(),
      subject: (exam.subject as unknown as { name?: string })?.name ?? "Unknown subject",
      class: exam.class,
      term: exam.term,
      totalQuestions: exam.questionCount,
      duration: exam.duration,
      status: exam.status,
      date: exam.examDate,
      totalStudents,
      completedCount,
    };
  });

  const activeExams = exams.filter((e) => e.status === "Ongoing").length;
  const totalPossible = examRows.reduce((sum, r) => sum + r.totalStudents, 0);
  const totalCompleted = examRows.reduce((sum, r) => sum + r.completedCount, 0);

  const studentRows = students.map((s) => {
    const completed = s.completedExams ?? [];
    const avgScore =
      completed.length > 0
        ? Math.round(completed.reduce((sum, c) => sum + c.score, 0) / completed.length)
        : 0;
    return {
      id: s._id.toString(),
      firstName: s.firstName,
      lastName: s.lastName,
      class: s.class,
      admissionNumber: s.admissionNumber,
      examsTaken: completed.length,
      avgScore,
      isActive: s.isActive,
      createdAt: s.createdAt,
    };
  });

  return NextResponse.json({
    stats: {
      totalStudents: students.length,
      totalExams: exams.length,
      activeExams,
      pendingSubmissions: Math.max(0, totalPossible - totalCompleted),
      completionRate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    },
    exams: examRows,
    students: studentRows,
  });
}
