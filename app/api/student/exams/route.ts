import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/api-guards";
import { Exam, examClassFilter } from "@/lib/models/exam.model";
import { Submission } from "@/lib/models/submission.model";
import { computeExamStatus } from "@/lib/exam-status";

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

  // Pull ALL exams for this class first, rather than filtering by status
  // in the query - status is time-derived now (see lib/exam-status.ts),
  // so a stored value here can't be trusted. Status is computed fresh
  // below, per exam, using the current time.
  // Matches exams scoped to this student's class directly, PLUS general
  // exams (isGeneral: true) that list this class among their eligible
  // `classes` - see examClassFilter.
  const exams = await Exam.find(examClassFilter(session.user.class))
    .populate("subject", "name code")
    .select("-examCode -questions")
    .sort({ examDate: 1 })
    .lean();

  const now = new Date();

  const examsWithComputedStatus = exams
    .map((exam) => ({
      ...exam,
      computedStatus: computeExamStatus(new Date(exam.examDate), exam.duration, now),
    }))
    // Students only ever see Scheduled/Ongoing exams - a Completed exam
    // (window has closed) has nothing left for them to do here.
    .filter((exam) => exam.computedStatus === "Scheduled" || exam.computedStatus === "Ongoing");

  // Exclude exams this student has already finished - nothing left to do,
  // so no reason to keep showing it in their "available" list.
  const examIds = examsWithComputedStatus.map((e) => e._id);
  const finishedSubmissions = await Submission.find({
    exam: { $in: examIds },
    student: session.user.id,
    status: { $in: ["Submitted", "Marked"] },
  })
    .select("exam")
    .lean();
  const finishedExamIds = new Set(finishedSubmissions.map((s) => s.exam.toString()));

  const nowMs = now.getTime();

  const data = examsWithComputedStatus
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
      status: exam.computedStatus,
      totalMarks: exam.totalMarks,
      questionCount: exam.questionCount,
      // Lets the UI show "Not Yet Open" / disable Start before the
      // scheduled time without a wasted round trip - /start still
      // enforces this server-side regardless of what the client shows.
      isAvailable: new Date(exam.examDate).getTime() <= nowMs,
    }));

  return NextResponse.json({ exams: data });
}
