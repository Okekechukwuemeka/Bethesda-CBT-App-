import type { ExamStatus } from "@/lib/models/constants";

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

// Recomputes and persists status for a single exam document, only writing
// if it actually changed - avoids an unnecessary write on every read.
export async function syncExamStatus(exam: {
  examDate: Date;
  duration: number;
  status: ExamStatus;
  save: () => Promise<unknown>;
}): Promise<ExamStatus> {
  const computed = computeExamStatus(new Date(exam.examDate), exam.duration);
  if (computed !== exam.status) {
    exam.status = computed;
    await exam.save();
  }
  return computed;
}
