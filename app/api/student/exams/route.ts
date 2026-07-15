import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam } from "@/lib/models/exam.model";
import { Submission } from "@/lib/models/submission.model";

// GET /api/student/exams
// Lists exams scoped to the logged-in student's class. Exams the student
// has already submitted are excluded (nothing left to do); examCode and
// questions are stripped since the client only needs those after a
// successful code verification via /start.
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

  // Exclude exams this student has already finished - nothing left to do,
  // so no reason to keep showing it in their "available" list.
  const examIds = exams.map((e) => e._id);
  const finishedSubmissions = await Submission.find({
    exam: { $in: examIds },
    student: session.user.id,
    status: { $in: ["Submitted", "Marked"] },
  })
    .select("exam")
    .lean();
  const finishedExamIds = new Set(finishedSubmissions.map((s) => s.exam.toString()));

  const now = Date.now();

  const data = exams
    .filter((exam) => !finishedExamIds.has(exam._id.toString()))
    .map((exam) => ({
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
      // Lets the UI show "Not Yet Open" / disable Start before the
      // scheduled time without a wasted round trip - /start still
      // enforces this server-side regardless of what the client shows.
      isAvailable: new Date(exam.examDate).getTime() <= now,
    }));

  return NextResponse.json({ exams: data });
}
