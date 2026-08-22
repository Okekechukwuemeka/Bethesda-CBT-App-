import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";
import { toScriptStatus } from "@/lib/results-helpers";
import type { ClassLevel } from "@/lib/models/constants";
import type { StudentScript } from "@/types/admin-results";

// GET /api/staff/results/[className]/students?examId=...
// Same as the admin route, but refuses to serve scripts for an exam
// outside this teacher's assigned subject+class.
export async function GET(req: NextRequest, context: { params: Promise<{ className: string }> }) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const { className: rawClassName } = await context.params;
  const className = decodeURIComponent(rawClassName) as ClassLevel;

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  if (!examId || examId === "undefined" || examId === "null") {
    return NextResponse.json(
      { error: "Missing or invalid examId query parameter" },
      { status: 400 },
    );
  }

  await connectDB();

  let exam;
  try {
    exam = await Exam.findById(examId).populate({
      path: "questions.question",
      select: "text type",
    });
  } catch {
    return NextResponse.json({ error: "Invalid exam ID format" }, { status: 400 });
  }
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const scope = await assertTeacherScope(
    guard.session.user.id,
    exam.subject.toString(),
    className,
  );
  if (!scope.ok) return scope.response;

  const examObj = exam.toObject() as unknown as {
    class: ClassLevel;
    type: string;
    title: string;
    questions: {
      question: { _id: { toString(): string }; text: string; type: string };
      order: number;
    }[];
  };

  const theoryQuestionsInOrder = [...(examObj.questions || [])]
    .sort((a, b) => a.order - b.order)
    .filter((q) => q.question && q.question.type === "Theory")
    .map((q, i) => ({ id: q.question._id.toString(), questionNo: i + 1 }));

  const students = await Student.find({ class: className, isActive: true })
    .select("firstName lastName admissionNumber")
    .sort({ lastName: 1, firstName: 1 })
    .lean();

  const submissions = await Submission.find({ exam: exam._id })
    .select("student score totalMarks status submittedAt answers")
    .lean();
  const submissionByStudent = new Map(submissions.map((s) => [s.student.toString(), s]));

  const data: StudentScript[] = students.map((student) => {
    const submission = submissionByStudent.get(student._id.toString());
    const isMarked = submission?.status === "Marked";

    const answers = theoryQuestionsInOrder.map((q) => {
      const record = submission?.answers?.find((a) => a.question.toString() === q.id);
      return { questionNo: q.questionNo, answer: record?.textAnswer || "" };
    });

    return {
      id: student._id.toString(),
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNumber,
      score: isMarked ? submission.score : 0,
      totalMarks: submission?.totalMarks ?? 0,
      percentage:
        isMarked && submission.totalMarks > 0
          ? Math.round((submission.score / submission.totalMarks) * 100)
          : 0,
      status: toScriptStatus(submission?.status),
      submittedAt: submission?.submittedAt ? new Date(submission.submittedAt).toISOString() : "",
      answers: theoryQuestionsInOrder.length > 0 ? answers : undefined,
    };
  });

  return NextResponse.json({
    exam: { id: exam.id, title: examObj.title, type: examObj.type },
    students: data,
  });
}
