import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";
import { toScriptStatus } from "@/lib/results-helpers";
import type { ClassLevel } from "@/lib/models/constants";
import type { StudentScript } from "@/types/admin-results";

// GET /api/admin/results/[className]/students?examId=...
export async function GET(req: NextRequest, context: { params: Promise<{ className: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // 1. Read className from the actual route parameters
  const { className: rawClassName } = await context.params;
  const className = decodeURIComponent(rawClassName) as ClassLevel;

  // 2. Read examId from the URL query search parameters (?examId=...)
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");

  // Validate the incoming query string parameters
  if (!examId || examId === "undefined" || examId === "null") {
    return NextResponse.json(
      { error: "Missing or invalid examId query parameter" },
      { status: 400 },
    );
  }

  await connectDB();

  let exam;
  try {
    // 3. Look up the exam record using our query string variable
    exam = await Exam.findById(examId).populate({
      path: "questions.question",
      select: "text type",
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid exam ID format" }, { status: 400 });
  }

  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

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

  // Use our parsed className variable to gather active classroom students
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
