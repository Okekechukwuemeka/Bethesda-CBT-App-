import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";
import {
  buildSubjectResult,
  getClassActiveStudentCount,
  getExamsForClass,
  toScriptStatus,
} from "@/lib/results-helpers";
import type { ExamLean } from "@/lib/results-helpers";
import type { ClassLevel } from "@/lib/models/constants";
import type { ClassExportRow, SubjectResult } from "@/types/admin-results";

// GET /api/admin/results/[className]/export
//
// Powers the "Download Class Results (All Subjects)" button - one request
// that returns every subject's summary stats plus a lean per-student score
// row for each, so the client can build a single multi-sheet workbook
// without stitching together N separate exam requests itself.
//
// Deliberately excludes per-question theory answers (unlike the
// exams/[examId]/students route) - a spreadsheet cell just needs the final
// score, not the full written answer, and this keeps the payload small
// even for a class with many subjects.
export async function GET(req: NextRequest, context: { params: Promise<{ className: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { className: rawClassName } = await context.params;
  const className = decodeURIComponent(rawClassName) as ClassLevel;
  await connectDB();

  const [exams, totalStudents, students] = await Promise.all([
    getExamsForClass(className),
    getClassActiveStudentCount(className),
    Student.find({ class: className, isActive: true })
      .select("firstName lastName admissionNumber")
      .sort({ lastName: 1, firstName: 1 })
      .lean(),
  ]);
  const subjects: SubjectResult[] = [];
  const scoresBySubject: Record<string, ClassExportRow[]> = {};

  for (const exam of exams) {
    const submissions = await Submission.find({ exam: exam._id })
      .select("student status score totalMarks")
      .lean();

    subjects.push(buildSubjectResult(exam as unknown as ExamLean, submissions, totalStudents));

    const submissionByStudent = new Map(submissions.map((s) => [s.student.toString(), s]));
    scoresBySubject[exam._id.toString()] = students.map((student) => {
      const submission = submissionByStudent.get(student._id.toString());
      const isMarked = submission?.status === "Marked";

      return {
        admissionNo: student.admissionNumber,
        studentName: `${student.firstName} ${student.lastName}`,
        score: isMarked ? submission.score : 0,
        totalMarks: submission?.totalMarks ?? 0,
        percentage:
          isMarked && submission.totalMarks > 0
            ? Math.round((submission.score / submission.totalMarks) * 100)
            : 0,
        status: toScriptStatus(submission?.status),
      };
    });
  }

  return NextResponse.json({ className, subjects, scoresBySubject });
}
