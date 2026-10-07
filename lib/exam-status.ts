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

// Operators like $type/$expr on typed paths trip Mongoose's strict filter
// typings although they are valid MongoDB, so these filters opt out of that check.
const asFilter = (filter: Record<string, unknown>) => filter as never;

// Brings the stored `status` of EVERY exam up to date in three bulk writes.
//
// The admin exams list used to sync each exam it returned, and since it
// returned all of them, every visit refreshed every exam (which the
// dashboard's "active exams" count relies on, as it reads the stored value).
// Now that the list is paginated it only returns one page, so the sync is
// done for all exams up front instead of per returned row. Exams missing a
// usable examDate/duration are skipped, as in syncExamStatus.
export async function syncAllExamStatuses(now: Date = new Date()): Promise<void> {
  const usable = { duration: { $type: "number" as const } };
  const endOfWindow = { $add: ["$examDate", { $multiply: ["$duration", 60_000] }] };
  const options = { timestamps: false } as const;

  await Promise.all([
    Exam.updateMany(
      asFilter({ ...usable, examDate: { $type: "date" as const, $gt: now }, status: { $ne: "Scheduled" } }),
      { $set: { status: "Scheduled" } },
      options,
    ),
    Exam.updateMany(
      asFilter({
        ...usable,
        examDate: { $type: "date" as const, $lte: now },
        status: { $ne: "Ongoing" },
        $expr: { $gt: [endOfWindow, now] },
      }),
      { $set: { status: "Ongoing" } },
      options,
    ),
    Exam.updateMany(
      asFilter({
        ...usable,
        examDate: { $type: "date" as const, $lte: now },
        status: { $ne: "Completed" },
        $expr: { $lte: [endOfWindow, now] },
      }),
      { $set: { status: "Completed" } },
      options,
    ),
  ]);
}

// The same three windows as a query filter, for filtering a list by status
// at the database level (needed for correct pagination counts). Uses the
// clock, not the stored status, so it is right even if a sync hasn't run.
export function examStatusFilter(status: ExamStatus, now: Date = new Date()) {
  const usable = { duration: { $type: "number" as const } };
  const endOfWindow = { $add: ["$examDate", { $multiply: ["$duration", 60_000] }] };

  if (status === "Scheduled") {
    return { ...usable, examDate: { $type: "date" as const, $gt: now } };
  }
  if (status === "Ongoing") {
    return {
      ...usable,
      examDate: { $type: "date" as const, $lte: now },
      $expr: { $gt: [endOfWindow, now] },
    };
  }
  return {
    ...usable,
    examDate: { $type: "date" as const, $lte: now },
    $expr: { $lte: [endOfWindow, now] },
  };
}
