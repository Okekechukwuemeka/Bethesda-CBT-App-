import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Exam, examClassFilter } from "@/lib/models/exam.model";
import { Student } from "@/lib/models/student.model";
import { Submission } from "@/lib/models/submission.model";
import type { IExamSnapshot } from "@/lib/models/submission.model";
import { computeQuestionBreakdown } from "@/lib/exam-snapshot";
import type { ClassLevel } from "@/lib/models/constants";
import type {
  ExamTypeLower,
  Performance,
  ResultStatus,
  ScriptStatus,
  StudentScript,
  SubjectResult,
  TheoryScoreEntry,
  TheoryScoreFailure,
} from "@/types/admin-results";

export function toLowerExamType(type: string): ExamTypeLower {
  return type.toLowerCase() as ExamTypeLower;
}

export function toScriptStatus(status?: string): ScriptStatus {
  if (status === "Marked") return "marked";
  if (status === "Submitted") return "pending"; // turned in, awaiting manual marking
  if (status === "In Progress") return "in-progress";
  return "not-started";
}

// Thresholds are a reasonable default (>=75 excellent, >=60 good, >=45
// average, below that poor) - adjust to match the school's actual grading
// scale if this doesn't line up with their existing bands. Shared between
// the classes list and anywhere else that needs to bucket a percentage
// into a performance tier, so the bands only ever live in one place.
export function bucketPerformance(avg: number): Performance {
  if (avg >= 75) return "excellent";
  if (avg >= 60) return "good";
  if (avg >= 45) return "average";
  return "poor";
}

// ---- Mixed exams: MCQ portion ------------------------------------------
// A Mixed exam stays "Submitted" until a human marks the theory part, so
// submission.status/score can't be used to show results. But the MCQ part
// is auto-graded at answer time (marksAwarded/isCorrect on each answer), so
// it's available immediately. These helpers surface it.

interface AnswerLean {
  isCorrect?: boolean;
  marksAwarded?: number;
}

// Sum of marks across the exam's Objective questions. Expects
// exam.questions populated with at least { type, marks } on `question`.
export function objectiveTotalMarks(
  examQuestions: { question?: { type?: string; marks?: number } | null }[] | undefined,
): number {
  return (examQuestions ?? []).reduce(
    (sum, q) => (q.question?.type === "Objective" ? sum + (q.question.marks ?? 0) : sum),
    0,
  );
}

// Sum of marks the auto-grader awarded on this submission's MCQ answers.
//
// Hardened so it can never report more than the MCQ section is worth:
//  - each question is counted at most once (duplicate answer records for the
//    same question are ignored),
//  - when `validQuestionIds` is given, answers to questions that are NOT part
//    of the exam's current MCQ set are ignored (e.g. the question list was
//    edited/replaced after the student started - typical with a rescheduled
//    exam - leaving stale graded answers behind),
//  - when `maxTotal` is given (> 0), the result is clamped to it as a last
//    line of defence, so "18/15" can never be displayed or exported.
export function objectiveScoreFromAnswers(
  answers: (AnswerLean & { question?: { toString(): string } | string | null })[] | undefined,
  opts: { validQuestionIds?: Set<string>; maxTotal?: number } = {},
): number {
  const seen = new Set<string>();
  let sum = 0;
  for (const a of answers ?? []) {
    if (typeof a.isCorrect !== "boolean") continue;
    const qid = a.question ? a.question.toString() : undefined;
    if (qid) {
      if (seen.has(qid)) continue;
      seen.add(qid);
      if (opts.validQuestionIds && !opts.validQuestionIds.has(qid)) continue;
    }
    sum += a.marksAwarded ?? 0;
  }
  const { maxTotal } = opts;
  return maxTotal && maxTotal > 0 ? Math.min(sum, maxTotal) : sum;
}

interface SubmissionLean {
  status: string;
  score: number;
  totalMarks: number;
}

export interface ExamLean {
  _id: mongoose.Types.ObjectId | string;
  subject: { name?: string } | string;
  title: string;
  type: string;
  totalMarks: number;
}

// One row per exam ("subject" on the Results page). Completion is judged
// by how many students actually have a fully-Marked submission, NOT by
// the exam's own `status` field - an exam can be "Completed" (its sitting
// window closed) while theory scripts still sit unmarked, and that's
// exactly the case this page needs to surface, not hide behind a
// misleadingly green "completed" badge.
export function buildSubjectResult(
  exam: ExamLean,
  submissions: SubmissionLean[],
  totalStudents: number,
): SubjectResult {
  const marked = submissions.filter((s) => s.status === "Marked" && s.totalMarks > 0);
  const percentages = marked.map((s) => (s.score / s.totalMarks) * 100);
  const rawScores = marked.map((s) => s.score);

  const averageScore =
    percentages.length > 0
      ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
      : 0;
  // Raw scores, not percentages - the Results table shows "8/10", not
  // "80%", so a teacher reads it the same way they'd read a mark sheet.
  const highestScore = rawScores.length > 0 ? Math.max(...rawScores) : 0;
  const lowestScore = rawScores.length > 0 ? Math.min(...rawScores) : 0;

  const markedCount = marked.length;
  // "In Progress" must mean a student is genuinely still writing. Once
  // students have SUBMITTED, an exam whose theory part is waiting for a
  // teacher is "Awaiting Marking" - not "In Progress" (the old behaviour
  // reported any exam with a submission as in progress, so a mixed exam
  // looked unfinished long after every student had handed in).
  const stillWriting = submissions.some((s) => s.status === "In Progress");
  const awaitingMarking = submissions.some((s) => s.status === "Submitted");

  let status: ResultStatus = "pending";
  if (totalStudents > 0 && markedCount >= totalStudents) status = "completed";
  else if (stillWriting) status = "in-progress";
  else if (awaitingMarking) status = "awaiting-marking";
  else if (markedCount > 0) status = "in-progress"; // all who sat are marked, others haven't sat yet

  return {
    id: exam._id.toString(),
    subject:
      typeof exam.subject === "string" ? exam.subject : (exam.subject?.name ?? "Unknown Subject"),
    examTitle: exam.title,
    examType: toLowerExamType(exam.type),
    totalStudents,
    totalMarks: exam.totalMarks,
    averageScore,
    highestScore,
    lowestScore,
    completed: markedCount,
    status,
  };
}

export async function getClassActiveStudentCount(className: ClassLevel): Promise<number> {
  await connectDB();
  return Student.countDocuments({ class: className, isActive: true });
}

// Active students' own ids for one class - used to scope a Submission
// query down to "this class's students" specifically. Needed because a
// Submission only references its student, not that student's class, so
// `Submission.find({ exam: examId })` alone returns every class's
// submissions once a single exam (a general exam) can be shared across
// several classes - fine when an exam belongs to exactly one class (the
// only students who could ever submit to it are that class's), but wrong
// the moment more than one class can submit to the same exam.
async function getActiveStudentIds(className: ClassLevel): Promise<mongoose.Types.ObjectId[]> {
  await connectDB();
  const students = await Student.find({ class: className, isActive: true }).select("_id").lean();
  return students.map((s) => s._id as mongoose.Types.ObjectId);
}

export async function getExamsForClass(className: ClassLevel) {
  await connectDB();
  // Includes general exams this class is eligible for, alongside exams
  // created specifically for this class - see examClassFilter.
  return Exam.find(examClassFilter(className))
    .populate("subject", "name")
    .sort({ examDate: -1 })
    .lean();
}

export async function getSubjectResultsForClass(className: ClassLevel): Promise<SubjectResult[]> {
  const [exams, totalStudents, studentIds, deletedGroups] = await Promise.all([
    getExamsForClass(className),
    getClassActiveStudentCount(className),
    getActiveStudentIds(className),
    getDeletedExamGroupsForClass(className),
  ]);

  const liveResults = await Promise.all(
    exams.map(async (exam) => {
      // Scoped to this class's own students (see getActiveStudentIds) -
      // without this, a general exam shared with other classes would
      // pull every one of those classes' submissions into THIS class's
      // average/highest/lowest/completed-count, even though most of them
      // have nothing to do with this class's results page.
      const submissions = await Submission.find({
        exam: exam._id,
        student: { $in: studentIds },
      })
        .select("status score totalMarks")
        .lean();
      return buildSubjectResult(exam as unknown as ExamLean, submissions, totalStudents);
    }),
  );

  // Results whose exam has since been deleted come after the live exams.
  const deletedResults = await buildDeletedSubjectResults(deletedGroups, studentIds, totalStudents);

  return [...liveResults, ...deletedResults];
}

// Micro-average across every marked submission in the class (not an
// average of each subject's own average - see buildSubjectResult's
// comment for why that distinction matters). Used by the classes list
// page to show one headline number per class.
export async function getClassAverageScore(className: ClassLevel): Promise<number> {
  await connectDB();

  const classExams = await Exam.find(examClassFilter(className)).select("_id");
  const classExamIds = classExams.map((e) => e._id);
  if (classExamIds.length === 0) return 0;

  const studentIds = await getActiveStudentIds(className);

  const markedSubmissions = await Submission.find({
    exam: { $in: classExamIds },
    // Same scoping as getSubjectResultsForClass above - without this, a
    // general exam shared with other classes would blend those classes'
    // scores into this class's headline average.
    student: { $in: studentIds },
    status: "Marked",
  }).select("score totalMarks");

  const percentages = markedSubmissions
    .filter((s) => s.totalMarks > 0)
    .map((s) => (s.score / s.totalMarks) * 100);

  return percentages.length > 0
    ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
    : 0;
}

// ---- Results whose exam has been deleted --------------------------------
// Deleting an exam keeps its submissions (see lib/exam-snapshot.ts). Those
// submissions carry an `examSnapshot` describing the exam, and everything
// below reads that instead of the (now missing) Exam document.

export interface DeletedExamGroup {
  examId: string;
  snapshot: IExamSnapshot;
}

// One entry per deleted exam that has results belonging to `className` -
// a class-specific exam matches on its own class, a general exam if the class
// was among those eligible (the same rule examClassFilter applies to live
// exams). Pass `subjectIds` to restrict to certain subjects (a teacher only
// sees the subjects they're assigned).
export async function getDeletedExamGroupsForClass(
  className: ClassLevel,
  subjectIds?: (mongoose.Types.ObjectId | string)[],
): Promise<DeletedExamGroup[]> {
  await connectDB();

  const match: Record<string, unknown> = {
    examSnapshot: { $exists: true },
    $or: [
      { "examSnapshot.class": className },
      { "examSnapshot.isGeneral": true, "examSnapshot.classes": className },
    ],
  };
  // aggregate() doesn't cast like find() does, so ids must already be ObjectIds.
  if (subjectIds) {
    match["examSnapshot.subject"] = {
      $in: subjectIds.map((id) => new mongoose.Types.ObjectId(String(id))),
    };
  }

  const rows = await Submission.aggregate<{ _id: mongoose.Types.ObjectId; snapshot: IExamSnapshot }>([
    { $match: match },
    { $group: { _id: "$exam", snapshot: { $first: "$examSnapshot" } } },
  ]);
  if (rows.length === 0) return [];

  // A snapshot can exist on submissions of an exam that is still there (if a
  // delete was interrupted after the snapshot step). Never list that exam
  // twice - its live row already covers it.
  const stillExisting = await Exam.find({ _id: { $in: rows.map((r) => r._id) } })
    .select("_id")
    .lean();
  const stillExistingIds = new Set(stillExisting.map((e) => e._id.toString()));

  return rows
    .filter((r) => !stillExistingIds.has(r._id.toString()))
    .map((r) => ({ examId: r._id.toString(), snapshot: r.snapshot }))
    .sort(
      (a, b) =>
        new Date(b.snapshot.examDate ?? 0).getTime() - new Date(a.snapshot.examDate ?? 0).getTime(),
    );
}

// Same per-exam summary row the Results page shows for a live exam, built
// from the snapshot instead.
export async function buildDeletedSubjectResults(
  groups: DeletedExamGroup[],
  studentIds: mongoose.Types.ObjectId[],
  totalStudents: number,
): Promise<SubjectResult[]> {
  if (groups.length === 0) return [];

  const submissions = await Submission.find({
    exam: { $in: groups.map((g) => g.examId) },
    student: { $in: studentIds },
  })
    .select("exam status score totalMarks")
    .lean();

  const byExam = new Map<string, typeof submissions>();
  for (const submission of submissions) {
    const key = submission.exam.toString();
    if (!byExam.has(key)) byExam.set(key, []);
    byExam.get(key)!.push(submission);
  }

  return groups.map(({ examId, snapshot }) => ({
    ...buildSubjectResult(
      {
        _id: examId,
        subject: snapshot.subjectName,
        title: snapshot.title,
        type: snapshot.type,
        totalMarks: snapshot.totalMarks,
      },
      byExam.get(examId) ?? [],
      totalStudents,
    ),
    examDeleted: true,
    term: snapshot.term,
    academicYear: snapshot.academicYear,
  }));
}

// What the "students" Results routes need to know about an exam in order to
// list a class's scripts: either read from the live exam, or - once it has
// been deleted - from the snapshot kept on its submissions.
export interface ExamResultsContext {
  examId: string;
  title: string;
  type: string;
  // Null only for a legacy exam whose subject wasn't a real reference.
  subjectId: string | null;
  deleted: boolean;
  // Total marks of the whole exam (from the snapshot once it has been deleted).
  totalMarks: number;
  // Theory questions in presentation order (this order is what numbers the
  // script answers Q1, Q2...).
  theoryQuestionIds: string[];
  objectiveTotal: number;
  // Ids of the exam's current Objective questions. Undefined for a deleted
  // exam (the snapshot doesn't keep them) - scoring then relies on the clamp.
  objectiveQuestionIds?: string[];
}

interface PopulatedExamForResults {
  _id: mongoose.Types.ObjectId;
  title: string;
  type: string;
  totalMarks?: number;
  subject?: unknown;
  questions?: {
    question?: { _id: mongoose.Types.ObjectId; type: string; marks: number } | null;
    order?: number;
  }[];
}

// `examId` must already be a valid ObjectId string (callers check this and
// answer 400 otherwise). Returns null when there is neither a live exam nor
// any preserved result for that id.
export async function loadExamResultsContext(examId: string): Promise<ExamResultsContext | null> {
  await connectDB();

  const exam = (await Exam.findById(examId)
    .populate({ path: "questions.question", select: "text type marks" })
    .lean()) as unknown as PopulatedExamForResults | null;

  if (exam) {
    const refs = exam.questions ?? [];
    const metaById = new Map<string, { type: string; marks: number }>();
    for (const ref of refs) {
      if (ref.question) {
        metaById.set(ref.question._id.toString(), {
          type: ref.question.type,
          marks: ref.question.marks,
        });
      }
    }
    const { theoryQuestionIds, objectiveTotal } = computeQuestionBreakdown(
      refs.map((r) => ({ question: r.question?._id, order: r.order })),
      metaById,
    );

    const rawSubject = String(exam.subject ?? "");
    return {
      examId: exam._id.toString(),
      title: exam.title,
      type: exam.type,
      subjectId: mongoose.Types.ObjectId.isValid(rawSubject) ? rawSubject : null,
      deleted: false,
      totalMarks: exam.totalMarks ?? 0,
      theoryQuestionIds,
      // Only ever read for Mixed exams; cheap either way.
      objectiveTotal,
      objectiveQuestionIds: [...metaById.entries()]
        .filter(([, m]) => m.type === "Objective")
        .map(([id]) => id),
    };
  }

  const preserved = await Submission.findOne({ exam: examId, examSnapshot: { $exists: true } })
    .select("examSnapshot")
    .lean();
  const snapshot = preserved?.examSnapshot;
  if (!snapshot) return null;

  return {
    examId,
    title: snapshot.title,
    type: snapshot.type,
    subjectId: snapshot.subject ? snapshot.subject.toString() : null,
    deleted: true,
    totalMarks: snapshot.totalMarks ?? 0,
    theoryQuestionIds: (snapshot.theoryQuestionIds ?? []).map((id) => id.toString()),
    objectiveTotal: snapshot.objectiveTotal ?? 0,
  };
}

// The most a marker can award for the theory part of this exam. A Theory exam
// is all theory; a Mixed exam is worth whatever is left once the MCQ section
// (already auto-graded) is taken off. `submissionTotal` is the total recorded
// on the student's own submission when they handed in - it wins over the
// exam's current total so a later edit to the exam can't move the goalposts
// for scripts already written.
export function theoryMarksAvailable(ctx: ExamResultsContext, submissionTotal?: number): number {
  if (ctx.type === "Objective") return 0;
  const total = submissionTotal && submissionTotal > 0 ? submissionTotal : ctx.totalMarks;
  return ctx.type === "Mixed" ? Math.max(total - ctx.objectiveTotal, 0) : total;
}

// One StudentScript per active student in the class, whether or not they
// sat the exam.
export async function buildStudentScripts(
  className: ClassLevel,
  ctx: ExamResultsContext,
): Promise<StudentScript[]> {
  await connectDB();

  const theoryQuestionsInOrder = ctx.theoryQuestionIds.map((id, i) => ({
    id,
    questionNo: i + 1,
  }));

  // Mixed exams stay "Submitted" until theory is marked, but the MCQ part is
  // auto-graded already - expose it so the sheet/modal can show it.
  const isMixed = ctx.type === "Mixed";
  const objectiveTotal = isMixed ? ctx.objectiveTotal : 0;
  const objectiveIds = ctx.objectiveQuestionIds ? new Set(ctx.objectiveQuestionIds) : undefined;
  const hasTheoryPart = ctx.type === "Theory" || ctx.type === "Mixed";

  const students = await Student.find({ class: className, isActive: true })
    .select("firstName lastName admissionNumber")
    .sort({ lastName: 1, firstName: 1 })
    .lean();

  const submissions = await Submission.find({ exam: ctx.examId })
    .select("student score totalMarks status submittedAt answers theoryScore")
    .lean();
  const submissionByStudent = new Map(submissions.map((s) => [s.student.toString(), s]));

  return students.map((student) => {
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
      ...(isMixed && (submission?.status === "Submitted" || isMarked)
        ? {
            objectiveScore: objectiveScoreFromAnswers(submission?.answers, {
              validQuestionIds: objectiveIds,
              maxTotal: objectiveTotal,
            }),
            objectiveTotal,
          }
        : {}),
      // Only students who have handed in can be given a theory score.
      ...(hasTheoryPart && (submission?.status === "Submitted" || isMarked)
        ? {
            theoryScore: typeof submission?.theoryScore === "number" ? submission.theoryScore : null,
            theoryTotal: theoryMarksAvailable(ctx, submission?.totalMarks),
          }
        : {}),
    };
  });
}

// ---- Entering theory scores ---------------------------------------------
// MCQ answers are scored by the platform the moment a student submits. The
// theory part is marked by a teacher on the downloaded script, who then types
// the mark in here. Saving a mark records it, adds it to the MCQ score (Mixed
// exams), and flips the submission to "Marked" - which is what moves the
// Results page stats (Awaiting Marking -> Completed) and lets the student see
// their score. Only new optional fields and the existing score/status are
// written, so nothing already stored is altered for a script nobody marks.

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface ApplyTheoryScoresResult {
  savedCount: number;
  failures: TheoryScoreFailure[];
}

// `entries` are validated one by one: a bad row is reported in `failures` and
// the good rows are still saved, so one typo doesn't throw away a teacher's
// whole sheet of marks. The caller is responsible for authorising `className`
// and the exam (admin: anything; teacher: assigned subject + class only).
export async function applyTheoryScores(
  className: ClassLevel,
  ctx: ExamResultsContext,
  entries: TheoryScoreEntry[],
  marker: { id: string; role: "admin" | "staff" },
): Promise<ApplyTheoryScoresResult> {
  await connectDB();

  const failures: TheoryScoreFailure[] = [];
  const fail = (studentId: string, error: string) => failures.push({ studentId, error });

  const classStudents = await Student.find({ class: className, isActive: true })
    .select("_id firstName lastName")
    .lean();
  const nameById = new Map(
    classStudents.map((s) => [s._id.toString(), `${s.firstName} ${s.lastName}`]),
  );

  // Later entries for the same student win.
  const byStudent = new Map<string, TheoryScoreEntry>();
  for (const entry of entries) byStudent.set(entry.studentId, entry);

  const wanted = [...byStudent.keys()].filter((id) => nameById.has(id));
  const submissions = await Submission.find({
    exam: ctx.examId,
    student: { $in: wanted },
  })
    .select("student status totalMarks answers")
    .lean();
  const submissionByStudent = new Map(submissions.map((s) => [s.student.toString(), s]));

  const objectiveIds = ctx.objectiveQuestionIds ? new Set(ctx.objectiveQuestionIds) : undefined;
  const markerId = mongoose.Types.ObjectId.isValid(marker.id)
    ? new mongoose.Types.ObjectId(marker.id)
    : undefined;
  const now = new Date();

  const ops: mongoose.AnyBulkWriteOperation<(typeof submissions)[number]>[] = [];

  for (const [studentId, entry] of byStudent) {
    const name = nameById.get(studentId);
    if (!name) {
      fail(studentId, "This student is not an active member of this class.");
      continue;
    }
    const submission = submissionByStudent.get(studentId);
    if (!submission || (submission.status !== "Submitted" && submission.status !== "Marked")) {
      fail(studentId, `${name} has not submitted this exam yet, so there is nothing to mark.`);
      continue;
    }

    const submissionTotal = submission.totalMarks > 0 ? submission.totalMarks : ctx.totalMarks;
    const objectivePart =
      ctx.type === "Mixed"
        ? objectiveScoreFromAnswers(submission.answers, {
            validQuestionIds: objectiveIds,
            maxTotal: ctx.objectiveTotal,
          })
        : 0;

    if (entry.theoryScore === null) {
      // Take a mark back: the script returns to "Awaiting Marking".
      ops.push({
        updateOne: {
          filter: { _id: submission._id },
          update: {
            $set: { status: "Submitted", score: objectivePart },
            $unset: {
              theoryScore: "",
              markedAt: "",
              theoryMarkedBy: "",
              theoryMarkedByRole: "",
            },
          },
        },
      });
      continue;
    }

    const value = entry.theoryScore;
    const max = theoryMarksAvailable(ctx, submission.totalMarks);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      fail(studentId, `${name}: the theory score must be a number.`);
      continue;
    }
    if (value < 0) {
      fail(studentId, `${name}: the theory score cannot be negative.`);
      continue;
    }
    if (value > max) {
      fail(studentId, `${name}: the theory score cannot be more than ${max}.`);
      continue;
    }

    const theoryScore = round2(value);
    ops.push({
      updateOne: {
        filter: { _id: submission._id },
        update: {
          $set: {
            theoryScore,
            score: round2(Math.min(objectivePart + theoryScore, submissionTotal)),
            totalMarks: submissionTotal,
            status: "Marked",
            markedAt: now,
            ...(markerId ? { theoryMarkedBy: markerId, theoryMarkedByRole: marker.role } : {}),
          },
        },
      },
    });
  }

  if (ops.length > 0) await Submission.bulkWrite(ops);
  return { savedCount: ops.length, failures };
}

export type DeleteResultsOutcome =
  | { ok: true; deletedCount: number }
  | { ok: false; reason: "exam-still-exists" | "not-found" };

// Permanently removes the preserved results of an exam that has already been
// deleted. This is the ONLY way results are ever deleted, and it is
// deliberately narrow:
//  - it refuses if the exam still exists (results of a live exam are not
//    touched from here),
//  - it only ever matches submissions carrying an examSnapshot, i.e. ones
//    whose exam really is gone,
//  - for a general exam shared by several classes it removes only the given
//    class's students' results, so deleting from one class's page can't wipe
//    another class's records.
export async function deleteResultsOfDeletedExam(
  className: ClassLevel,
  examId: string,
): Promise<DeleteResultsOutcome> {
  await connectDB();

  const examObjectId = new mongoose.Types.ObjectId(examId);

  if (await Exam.exists({ _id: examObjectId })) return { ok: false, reason: "exam-still-exists" };

  const sample = await Submission.findOne({ exam: examObjectId, examSnapshot: { $exists: true } })
    .select("examSnapshot")
    .lean();
  const snapshot = sample?.examSnapshot;
  if (!snapshot) return { ok: false, reason: "not-found" };

  const appliesToClass = snapshot.isGeneral
    ? (snapshot.classes ?? []).includes(className)
    : snapshot.class === className;
  if (!appliesToClass) return { ok: false, reason: "not-found" };

  const filter: Record<string, unknown> = { exam: examObjectId, examSnapshot: { $exists: true } };
  if (snapshot.isGeneral) {
    const classStudents = await Student.find({ class: className }).select("_id").lean();
    filter.student = { $in: classStudents.map((s) => s._id) };
  }

  const result = await Submission.deleteMany(filter);
  return { ok: true, deletedCount: result.deletedCount ?? 0 };
}
