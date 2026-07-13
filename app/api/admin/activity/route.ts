import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/lib/models/submission.model";
import "@/lib/models/exam.model";
import "@/lib/models/subject.model";
import { requireAdmin } from "@/lib/api-guards";
import { Submission } from "@/lib/models/submission.model";

interface PopulatedStudent {
  firstName: string;
  lastName: string;
}
interface PopulatedExam {
  title: string;
  subject?: { name: string } | null;
}

function isPopulatedStudent(v: unknown): v is PopulatedStudent {
  return !!v && typeof v === "object" && "firstName" in v;
}
function isPopulatedExam(v: unknown): v is PopulatedExam {
  return !!v && typeof v === "object" && "title" in v;
}

// GET /api/admin/activity?limit=10
// Most recently updated submissions across every exam - a student starting,
// syncing an answer, or submitting all bump `updatedAt`, so this doubles
// as both a "recent activity" feed (dashboard) and a raw submissions list
// (Submissions tab), depending on how the caller filters/uses the result.
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 10, 100);

  const submissions = await Submission.find({ status: { $ne: "Not Started" } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate("student", "firstName lastName")
    .populate({
      path: "exam",
      select: "title subject",
      populate: { path: "subject", select: "name" },
    });

  const activities = submissions.map((s) => {
    const student = isPopulatedStudent(s.student) ? s.student : null;
    const exam = isPopulatedExam(s.exam) ? s.exam : null;

    const isDone = s.status === "Marked" || s.status === "Submitted";
    const timeTakenSeconds =
      s.startedAt && s.submittedAt
        ? Math.round((s.submittedAt.getTime() - s.startedAt.getTime()) / 1000)
        : null;

    return {
      id: s.id,
      student: student ? `${student.firstName} ${student.lastName}` : "Unknown student",
      exam: exam ? exam.title : "Unknown exam",
      subject: exam?.subject?.name ?? "Unknown subject",
      action: isDone ? "submitted" : s.status === "In Progress" ? "started" : "pending review",
      status: isDone ? "completed" : s.status === "In Progress" ? "in-progress" : "pending",
      submissionStatus: s.status, // raw status, for callers that need Marked vs Submitted specifically
      score: s.score,
      totalMarks: s.totalMarks,
      timeTakenSeconds,
      submittedAt: s.submittedAt,
      time: s.updatedAt,
    };
  });

  return NextResponse.json({ activities });
}
