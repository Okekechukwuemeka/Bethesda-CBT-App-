import type { ExamStatus } from "@/lib/models/constants";
import { Exam } from "@/lib/models/exam.model";
import mongoose from "mongoose";

// Status is fully time-derived - no dependency on whether any student
// actually logs in. This deliberately does NOT track attendance: an exam
// with zero students present still correctly becomes "Completed" once its
// window closes, since a student being absent shouldn't leave the exam
// looking perpetually "Scheduled" or stuck "Ongoing" forever.
export function computeExamStatus(
  examDate: Date,
  durationMinutes: number,
  now: Date = new Date(),
): ExamStatus {
  const start = examDate.getTime();
  const end = start + durationMinutes * 60_000;
  const t = now.getTime();

  if (t < start) return "Scheduled";
  if (t < end) return "Ongoing";
  return "Completed";
}

// Recomputes and persists status for a single exam, only writing if it
// actually changed - avoids an unnecessary write on every read.
//
// Accepts either a real Mongoose document or a plain (e.g. .lean()) object
// - either way, persistence goes through Exam.updateOne rather than
// exam.save(). A full save() re-validates every field on the document,
// which means a malformed legacy exam (missing unrelated required fields)
// would fail to ever sync its status again; updateOne only touches the
// `status` field and skips document-wide validation entirely.
export async function syncExamStatus(exam: {
  _id: mongoose.Types.ObjectId | string;
  examDate: Date | string | null | undefined;
  duration: number | null | undefined;
  status: ExamStatus;
}): Promise<ExamStatus> {
  // A malformed/incomplete legacy document (missing examDate or duration)
  // can't have a status meaningfully computed - leave it as whatever is
  // currently stored rather than crashing or computing garbage from
  // `Invalid Date`/NaN.
  if (!exam.examDate || exam.duration == null) {
    return exam.status;
  }

  const parsedDate = new Date(exam.examDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return exam.status;
  }

  const computed = computeExamStatus(parsedDate, exam.duration);
  if (computed !== exam.status) {
    await Exam.updateOne({ _id: exam._id }, { $set: { status: computed } });
    exam.status = computed;
  }
  return computed;
}
