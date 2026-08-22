import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Subject } from "@/lib/models/subject.model";
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

  // Deliberately not using .populate("subject", "name") here: Mongoose
  // casts every document's `subject` to ObjectId as part of building the
  // populate query, and throws for the *entire* request if even one
  // legacy/bad document has a raw string (e.g. "Mathematics") there
  // instead of a real ref. Resolving subject names ourselves means one
  // bad row degrades gracefully instead of taking down the dashboard.
  const [exams, students] = await Promise.all([
    Exam.find().sort({ examDate: -1 }).lean(),
    Student.find().lean(),
  ]);

  const validSubjectIds = Array.from(
    new Set(
      exams
        .map((e) => e.subject)
        .filter((s): s is mongoose.Types.ObjectId =>
          mongoose.Types.ObjectId.isValid(s as unknown as string),
        )
        .map((s) => s.toString()),
    ),
  );
  const subjectDocs = await Subject.find({ _id: { $in: validSubjectIds } })
    .select("name")
    .lean();
  const subjectNameById = new Map(subjectDocs.map((s) => [s._id.toString(), s.name]));

  function resolveSubjectName(raw: unknown): string {
    const asString = String(raw ?? "");
    if (mongoose.Types.ObjectId.isValid(asString)) {
      return subjectNameById.get(asString) ?? "Unknown subject";
    }
    // Legacy row: the subject field itself already holds a plain name
    // string rather than an ObjectId ref - use it as-is instead of
    // showing "Unknown subject" for data that's actually fine to display.
    return asString || "Unknown subject";
  }

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
    // A general exam has no single `class` - its "total students" is the
    // sum across every class it's eligible for instead of one lookup.
    const totalStudents = exam.isGeneral
      ? (exam.classes ?? []).reduce((sum, c) => sum + classSize(c), 0)
      : classSize(exam.class ?? "");
    const completedCount = completedByExamId.get(exam._id.toString()) ?? 0;
    return {
      id: exam._id.toString(),
      subject: resolveSubjectName(exam.subject),
      class: exam.isGeneral ? undefined : exam.class,
      classes: exam.isGeneral ? exam.classes : undefined,
      isGeneral: exam.isGeneral,
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
