import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";
import { toScriptStatus } from "@/lib/results-helpers";
import type { ClassLevel } from "@/lib/models/constants";
import type { StudentScript } from "@/types/admin-results";

// GET /api/admin/results/exams/[examId]/students
// Returns every active student in the exam's class, with their submission
// (if any) and, for Theory questions only, their written answers in
// question order - this is what feeds the printable script PDF and the
// Student Scripts modal. Objective answers aren't included since those
// are already auto-graded and don't need a human to review them.
export async function GET(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  await connectDB();

  const exam = await Exam.findById(examId).populate({
    path: "questions.question",
    select: "text type",
  });
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

  const theoryQuestionsInOrder = [...examObj.questions]
    .sort((a, b) => a.order - b.order)
    .filter((q) => q.question.type === "Theory")
    .map((q, i) => ({ id: q.question._id.toString(), questionNo: i + 1 }));

  const students = await Student.find({ class: examObj.class, isActive: true })
    .select("firstName lastName admissionNumber")
    .sort({ lastName: 1, firstName: 1 })
    .lean();

  const submissions = await Submission.find({ exam: exam._id })
    .select("student score totalMarks status submittedAt answers")
    .lean();
  const submissionByStudent = new Map(submissions.map((s) => [s.student.toString(), s]));

  const data: StudentScript[] = students.map((student) => {
    const submission = submissionByStudent.get(student._id.toString());

    const answers = theoryQuestionsInOrder.map((q) => {
      const record = submission?.answers?.find((a) => a.question.toString() === q.id);
      return { questionNo: q.questionNo, answer: record?.textAnswer || "" };
    });

    return {
      id: student._id.toString(),
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNumber,
      score:
        submission?.status === "Marked" && submission.totalMarks > 0
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
