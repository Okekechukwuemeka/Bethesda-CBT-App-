import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";

// GET /api/student/exams
// Lists exams scoped to the logged-in student's class. Completed exams are
// excluded here (nothing left to do); examCode/questions are stripped since
// the client only needs those after a successful code verification.
export async function GET() {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;
  const { session } = guard;

  await connectDB();

  const exams = await Exam.find({
    class: session.user.class,
    status: { $in: ["Scheduled", "Ongoing"] },
  })
    .populate("subject", "name code")
    .select("-examCode -questions")
    .sort({ examDate: 1 })
    .lean();

  const data = exams.map((exam) => ({
    id: exam._id.toString(),
    title: exam.title,
    subject: (exam.subject as unknown as { name?: string })?.name ?? "Unknown Subject",
    term: exam.term,
    academicYear: exam.academicYear,
    examDate: exam.examDate,
    duration: exam.duration,
    type: exam.type,
    status: exam.status,
    totalMarks: exam.totalMarks,
    questionCount: exam.questionCount,
  }));

  return NextResponse.json({ exams: data });
}
