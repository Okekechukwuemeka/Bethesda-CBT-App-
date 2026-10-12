import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";
import { Question } from "@/lib/models/question.model";
import {
  buildSubjectResult,
  getClassActiveStudentCount,
  getDeletedExamGroupsForClass,
  getExamsForClass,
  objectiveScoreFromAnswers,
  objectiveTotalMarks,
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

  const [exams, totalStudents, students, deletedGroups] = await Promise.all([
    getExamsForClass(className),
    getClassActiveStudentCount(className),
    Student.find({ class: className, isActive: true })
      .select("firstName lastName admissionNumber")
      .sort({ lastName: 1, firstName: 1 })
      .lean(),
    getDeletedExamGroupsForClass(className),
  ]);
  const subjects: SubjectResult[] = [];
  const scoresBySubject: Record<string, ClassExportRow[]> = {};
  const studentIds = new Set(students.map((s) => s._id.toString()));

  // Everything the export needs to know about one exam, whether it still
  // exists or its results were kept after it was deleted.
  interface ExportSource {
    examId: string;
    lean: ExamLean;
    isMixed: boolean;
    objectiveTotal: number;
    objectiveIds?: Set<string>;
    deleted?: { term?: string; academicYear?: string };
  }
  const sources: ExportSource[] = [];

  for (const exam of exams) {
    const isMixed = exam.type === "Mixed";
    // A Mixed exam sits at "Submitted" until theory is marked, so `score`
    // is withheld below - but its auto-graded MCQ part is already known.
    // Needs the attached questions' type/marks to work out the MCQ total.
    let objectiveTotal = 0;
    let objectiveIds: Set<string> | undefined;
    if (isMixed) {
      const attached = await Question.find({
        _id: { $in: (exam.questions ?? []).map((q) => q.question) },
      })
        .select("type marks")
        .lean();
      objectiveTotal = objectiveTotalMarks(attached.map((question) => ({ question })));
      objectiveIds = new Set(
        attached.filter((q) => q.type === "Objective").map((q) => q._id.toString()),
      );
    }
    sources.push({
      examId: exam._id.toString(),
      lean: exam as unknown as ExamLean,
      isMixed,
      objectiveTotal,
      objectiveIds,
    });
  }

  // Exams that were deleted but whose results were kept: their MCQ total
  // was captured in the snapshot, so nothing needs looking up.
  for (const { examId, snapshot } of deletedGroups) {
    sources.push({
      examId,
      lean: {
        _id: examId,
        subject: snapshot.subjectName,
        title: snapshot.title,
        type: snapshot.type,
        totalMarks: snapshot.totalMarks,
      },
      isMixed: snapshot.type === "Mixed",
      objectiveTotal: snapshot.objectiveTotal ?? 0,
      deleted: { term: snapshot.term, academicYear: snapshot.academicYear },
    });
  }

  for (const { examId, lean, isMixed, objectiveTotal, objectiveIds, deleted } of sources) {
    const submissions = await Submission.find({ exam: examId })
      .select(isMixed ? "student status score totalMarks answers" : "student status score totalMarks")
      .lean();
    // Scoped to this class's own students before it feeds into
    // buildSubjectResult below - without this, a general exam shared
    // with other classes would blend those classes' scores into this
    // class's average/highest/lowest/completed-count. The per-student
    // scoresBySubject rows further down are already safe regardless
    // (they only ever map over `students`, this class's list), but the
    // subject-level aggregate isn't unless it's filtered too.
    const classSubmissions = submissions.filter((s) => studentIds.has(s.student.toString()));

    subjects.push({
      ...buildSubjectResult(lean, classSubmissions, totalStudents),
      ...(deleted ? { examDeleted: true, ...deleted } : {}),
    });

    const submissionByStudent = new Map(classSubmissions.map((s) => [s.student.toString(), s]));
    scoresBySubject[examId] = students.map((student) => {
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
        ...(isMixed && (submission?.status === "Submitted" || isMarked)
          ? {
              objectiveScore: objectiveScoreFromAnswers(
                (
                  submission as {
                    answers?: { question?: unknown; isCorrect?: boolean; marksAwarded?: number }[];
                  }
                ).answers as Parameters<typeof objectiveScoreFromAnswers>[0],
                { validQuestionIds: objectiveIds, maxTotal: objectiveTotal },
              ),
              objectiveTotal,
            }
          : {}),
      };
    });
  }

  return NextResponse.json({ className, subjects, scoresBySubject });
}
