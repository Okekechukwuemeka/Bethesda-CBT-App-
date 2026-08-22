import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { Exam, examClassFilter } from "@/lib/models/exam.model";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";
import { buildSubjectResult, getClassActiveStudentCount, type ExamLean } from "@/lib/results-helpers";
import type { ClassLevel } from "@/lib/models/constants";

// GET /api/staff/results/[className]/subjects
// Same shape as the admin equivalent, but only exams for subjects THIS
// teacher is assigned - a teacher assigned Chemistry for SSS1 never sees
// SSS1's Physics results here, even though they can see the class.
export async function GET(req: NextRequest, context: { params: Promise<{ className: string }> }) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const { className: rawClassName } = await context.params;
  const className = decodeURIComponent(rawClassName) as ClassLevel;

  const scope = await assertTeacherScope(guard.session.user.id, undefined, className);
  if (!scope.ok) return scope.response;

  await connectDB();

  const [exams, totalStudents, students] = await Promise.all([
    Exam.find({ ...examClassFilter(className), subject: { $in: scope.staff.assignedSubjects } })
      .populate("subject", "name")
      .sort({ examDate: -1 })
      .lean(),
    getClassActiveStudentCount(className),
    Student.find({ class: className, isActive: true }).select("_id").lean(),
  ]);
  const studentIds = students.map((s) => s._id);

  const subjects = await Promise.all(
    exams.map(async (exam) => {
      const submissions = await Submission.find({
        exam: exam._id,
        student: { $in: studentIds },
      })
        .select("status score totalMarks")
        .lean();
      return buildSubjectResult(exam as unknown as ExamLean, submissions, totalStudents);
    }),
  );

  return NextResponse.json({ subjects, className });
}
