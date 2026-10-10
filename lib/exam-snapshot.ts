import mongoose from "mongoose";
import { Exam } from "@/lib/models/exam.model";
import { Question } from "@/lib/models/question.model";
import { Subject } from "@/lib/models/subject.model";
import { Submission } from "@/lib/models/submission.model";
import type { IExamSnapshot } from "@/lib/models/submission.model";
import type { ClassLevel, ExamType } from "@/lib/models/constants";

// Student results must outlive the exam they were written for. A Submission
// only stores a reference (`exam`) to its exam, and the Results pages used to
// describe a result entirely by reading that exam (title, subject, class,
// the order of its theory questions...). So before an exam is deleted, the
// handful of details those pages need are copied onto each of its submissions
// as `examSnapshot`. After that the submissions simply carry on without the
// exam. See Submission.examSnapshot.

interface QuestionRef {
  question?: mongoose.Types.ObjectId | string | null;
  order?: number;
}

interface QuestionMeta {
  type: string;
  marks: number;
}

// Pure so it can be tested without a database. Mirrors how the Results
// routes derive their numbering from a live exam: questions in the exam's
// own order, theory ones numbered 1..n, and the objective marks summed.
export function computeQuestionBreakdown(
  refs: QuestionRef[],
  metaById: Map<string, QuestionMeta>,
): { theoryQuestionIds: string[]; objectiveTotal: number } {
  const ordered = [...refs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const theoryQuestionIds: string[] = [];
  let objectiveTotal = 0;

  for (const ref of ordered) {
    if (!ref.question) continue;
    const id = ref.question.toString();
    const meta = metaById.get(id);
    // A question deleted from the bank after being attached has no
    // metadata any more - skipped, exactly as the live Results routes do.
    if (!meta) continue;
    if (meta.type === "Theory") theoryQuestionIds.push(id);
    else if (meta.type === "Objective") objectiveTotal += meta.marks ?? 0;
  }

  return { theoryQuestionIds, objectiveTotal };
}

// The shape of a lean() Exam document, with `subject` left loose on purpose:
// a legacy document can hold a plain subject name there instead of an
// ObjectId (see the comments in the admin exams routes), and this must cope
// with that rather than throw while an admin is trying to delete the exam.
interface ExamLeanForSnapshot {
  _id: mongoose.Types.ObjectId;
  title: string;
  subject?: unknown;
  class?: ClassLevel;
  classes?: ClassLevel[];
  isGeneral?: boolean;
  term?: string;
  academicYear?: string;
  type: ExamType;
  examDate?: Date;
  totalMarks?: number;
  questions?: QuestionRef[];
}

export async function buildExamSnapshot(exam: ExamLeanForSnapshot): Promise<IExamSnapshot> {
  const refs = exam.questions ?? [];
  const questionIds = refs.map((r) => r.question).filter((q): q is NonNullable<typeof q> => !!q);

  const questions = questionIds.length
    ? await Question.find({ _id: { $in: questionIds } })
        .select("type marks")
        .lean()
    : [];
  const metaById = new Map(
    questions.map((q) => [q._id.toString(), { type: q.type as string, marks: q.marks }]),
  );
  const { theoryQuestionIds, objectiveTotal } = computeQuestionBreakdown(refs, metaById);

  let subjectId: mongoose.Types.ObjectId | undefined;
  let subjectName = "Unknown Subject";
  const rawSubject = String(exam.subject ?? "");
  if (mongoose.Types.ObjectId.isValid(rawSubject)) {
    subjectId = new mongoose.Types.ObjectId(rawSubject);
    const subjectDoc = await Subject.findById(rawSubject).select("name").lean();
    if (subjectDoc) subjectName = subjectDoc.name;
  } else if (rawSubject) {
    subjectName = rawSubject; // legacy row that stored the name directly
  }

  return {
    title: exam.title,
    subject: subjectId,
    subjectName,
    isGeneral: Boolean(exam.isGeneral),
    class: exam.isGeneral ? undefined : exam.class,
    classes: exam.isGeneral ? exam.classes : undefined,
    term: exam.term,
    academicYear: exam.academicYear,
    type: exam.type,
    examDate: exam.examDate,
    totalMarks: exam.totalMarks ?? 0,
    theoryQuestionIds: theoryQuestionIds.map((id) => new mongoose.Types.ObjectId(id)),
    objectiveTotal,
    deletedAt: new Date(),
  };
}

// timestamps: false - this is bookkeeping, not student activity. Without it
// every submission's updatedAt would jump to "now" and the dashboard's
// recent-activity feed (sorted by updatedAt) would fill with entries that
// look like students just did something.
const NO_TIMESTAMPS = { timestamps: false } as const;

export class SnapshotFailedError extends Error {
  constructor() {
    super(
      "Could not safely preserve this exam's student results, so the exam was NOT deleted. " +
        "Please try again; if it keeps happening, restart the server and retry.",
    );
    this.name = "SnapshotFailedError";
  }
}

export interface DeleteExamOutcome {
  // How many student submissions (results) were kept after the exam went away.
  preservedResults: number;
}

// Deletes an exam WITHOUT deleting any of its student submissions. Returns
// null when the exam doesn't exist.
//
// Order matters: the snapshot is written and verified first, and only then
// is the exam removed. If anything about the snapshot step goes wrong the
// exam is left in place and an error is thrown, so a failure can never leave
// results that are described by nothing.
export async function deleteExamPreservingResults(
  examId: string,
): Promise<DeleteExamOutcome | null> {
  const exam = await Exam.findById(examId).lean();
  if (!exam) return null;

  const snapshot = await buildExamSnapshot(exam as unknown as ExamLeanForSnapshot);

  await Submission.updateMany({ exam: exam._id }, { $set: { examSnapshot: snapshot } }, NO_TIMESTAMPS);

  // Verify, rather than trust, that the snapshot really landed on every
  // submission (e.g. a stale cached model silently dropping the field).
  const unprotected = await Submission.countDocuments({
    exam: exam._id,
    examSnapshot: { $exists: false },
  });
  if (unprotected > 0) throw new SnapshotFailedError();

  await Exam.deleteOne({ _id: exam._id });

  // A student could have started the exam in the instant between the
  // snapshot above and the delete. Cover any submission created in that gap
  // so it isn't left orphaned without a description.
  await Submission.updateMany(
    { exam: exam._id, examSnapshot: { $exists: false } },
    { $set: { examSnapshot: snapshot } },
    NO_TIMESTAMPS,
  );

  const preservedResults = await Submission.countDocuments({ exam: exam._id });
  return { preservedResults };
}
