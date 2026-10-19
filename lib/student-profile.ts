import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Student, type IStudent } from "@/lib/models/student.model";
import { Exam, examClassFilter } from "@/lib/models/exam.model";
import { Subject } from "@/lib/models/subject.model";
import { Submission } from "@/lib/models/submission.model";
import { TERMS } from "@/lib/models/constants";
import { computeExamStatus } from "@/lib/exam-status";
import { computeQuestionBreakdown } from "@/lib/exam-snapshot";
import { objectiveScoreFromAnswers } from "@/lib/results-helpers";
import type {
  ExaminationStatus,
  ExaminationSummary,
  PaperResult,
  PaperStatus,
  StudentProfileInfo,
  StudentProfileSummary,
  UpcomingExam,
} from "@/types/student-profile";

// Everything on a student's profile is computed from the live database on every
// request - exams, submissions, marking state. Nothing is stored or hardcoded.

type ExamKind = "Objective" | "Theory" | "Mixed";

const round = (n: number) => Math.round(n);

export function toStudentInfo(student: IStudent): StudentProfileInfo {
  return {
    id: String(student._id),
    admissionNumber: student.admissionNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    fullName: `${student.firstName} ${student.lastName}`,
    class: student.class,
    gender: student.gender,
    status: student.class === "graduated" ? "graduated" : student.isActive ? "active" : "inactive",
    enrolledAt: student.createdAt?.toISOString?.() ?? "",
    classHistory: (student.classHistory ?? []).map((h) => ({
      class: h.class,
      academicYear: h.academicYear,
      from: h.from ? new Date(h.from).toISOString() : undefined,
      to: h.to ? new Date(h.to).toISOString() : undefined,
    })),
  };
}

// ---- Examination keys -------------------------------------------------------
// An "examination" here is the set of a student's papers in one term of one
// academic year (each Exam document is a single subject's paper). The key is
// URL-safe: "2025/2026" + "First Term" -> "2025-2026_first-term".

const UNKNOWN_KEY = "unknown";

export function examinationKey(academicYear?: string, term?: string): string {
  if (!academicYear || !term) return UNKNOWN_KEY;
  return `${academicYear.replace("/", "-")}_${term.toLowerCase().replace(/\s+/g, "-")}`;
}

function examinationName(academicYear?: string, term?: string): string {
  if (!academicYear || !term) return "Earlier results (exam details unavailable)";
  return `${term} Examination ${academicYear}`;
}

// ---- Papers -----------------------------------------------------------------

interface LeanSubmission {
  _id: mongoose.Types.ObjectId;
  exam: mongoose.Types.ObjectId;
  status: string;
  score: number;
  totalMarks: number;
  answers?: { question?: mongoose.Types.ObjectId; isCorrect?: boolean; marksAwarded?: number }[];
  theoryScore?: number;
  submittedAt?: Date;
  markedAt?: Date;
  examSnapshot?: {
    title: string;
    subjectName: string;
    type: ExamKind;
    term?: string;
    academicYear?: string;
    examDate?: Date;
    totalMarks: number;
    objectiveTotal: number;
  };
}

interface LeanExam {
  _id: mongoose.Types.ObjectId;
  title: string;
  subject?: unknown;
  type: ExamKind;
  term: string;
  academicYear: string;
  examDate: Date;
  totalMarks?: number;
  questions?: {
    question?: { _id: mongoose.Types.ObjectId; type: string; marks: number } | null;
    order?: number;
  }[];
}

interface PaperContext {
  title: string;
  subject: string;
  type: ExamKind;
  term?: string;
  academicYear?: string;
  examDate?: Date;
  totalMarks: number;
  objectiveTotal: number;
  objectiveQuestionIds?: Set<string>;
  deleted: boolean;
}

function buildPaper(submission: LeanSubmission, ctx: PaperContext): PaperResult | null {
  const status: PaperStatus | null =
    submission.status === "Marked"
      ? "marked"
      : submission.status === "Submitted"
        ? "awaiting-marking"
        : submission.status === "In Progress"
          ? "in-progress"
          : null; // "Not Started" - nothing taken yet
  if (!status) return null;

  const totalMarks = submission.totalMarks > 0 ? submission.totalMarks : ctx.totalMarks;
  const hasTheory = ctx.type === "Theory" || ctx.type === "Mixed";
  const isMarked = status === "marked";
  const submitted = status !== "in-progress";

  const paper: PaperResult = {
    submissionId: submission._id.toString(),
    examId: submission.exam.toString(),
    examDeleted: ctx.deleted,
    title: ctx.title,
    subject: ctx.subject,
    type: ctx.type,
    examDate: ctx.examDate ? new Date(ctx.examDate).toISOString() : undefined,
    status,
    submittedAt: submission.submittedAt ? new Date(submission.submittedAt).toISOString() : undefined,
    markedAt: submission.markedAt ? new Date(submission.markedAt).toISOString() : undefined,
    score: isMarked ? submission.score : null,
    totalMarks,
    percentage: isMarked && totalMarks > 0 ? round((submission.score / totalMarks) * 100) : null,
    theoryPending: hasTheory && status === "awaiting-marking",
  };

  if (ctx.type === "Mixed" && submitted) {
    // Known the moment the student hands in - the platform scores MCQ itself.
    paper.objectiveScore = objectiveScoreFromAnswers(submission.answers, {
      validQuestionIds: ctx.objectiveQuestionIds,
      maxTotal: ctx.objectiveTotal,
    });
    paper.objectiveTotal = ctx.objectiveTotal;
  }
  if (hasTheory && submitted) {
    paper.theoryScore = typeof submission.theoryScore === "number" ? submission.theoryScore : null;
    paper.theoryTotal =
      ctx.type === "Mixed" ? Math.max(totalMarks - ctx.objectiveTotal, 0) : totalMarks;
  }
  return paper;
}

function summariseExamination(
  key: string,
  term: string | undefined,
  academicYear: string | undefined,
  papers: PaperResult[],
): ExaminationSummary {
  const marked = papers.filter((p) => p.status === "marked");
  const awaiting = papers.filter((p) => p.status === "awaiting-marking");
  const inProgress = papers.filter((p) => p.status === "in-progress");

  let status: ExaminationStatus;
  if (inProgress.length > 0) status = "in-progress";
  else if (marked.length === papers.length) status = "completed";
  else if (marked.length > 0) status = "partially-marked";
  else status = "awaiting-marking";

  const score = marked.reduce((sum, p) => sum + (p.score ?? 0), 0);
  const total = marked.reduce((sum, p) => sum + p.totalMarks, 0);

  const dates = papers
    .map((p) => (p.examDate ? new Date(p.examDate).getTime() : NaN))
    .filter((t) => Number.isFinite(t));

  return {
    key,
    name: examinationName(academicYear, term),
    term: term ?? "",
    academicYear: academicYear ?? "",
    firstDate: dates.length ? new Date(Math.min(...dates)).toISOString() : undefined,
    lastDate: dates.length ? new Date(Math.max(...dates)).toISOString() : undefined,
    papersTaken: papers.length,
    markedCount: marked.length,
    awaitingCount: awaiting.length,
    inProgressCount: inProgress.length,
    status,
    score: marked.length ? score : null,
    totalMarks: marked.length ? total : null,
    percentage: marked.length && total > 0 ? round((score / total) * 100) : null,
  };
}

export interface ExaminationGroup {
  summary: ExaminationSummary;
  papers: PaperResult[];
}

export interface StudentRecords {
  groups: ExaminationGroup[];
  summary: StudentProfileSummary;
}

// All of one student's examinations and papers, newest first. Results of exams
// that were later deleted are included - they are described by the snapshot kept
// on the submission, exactly like the Results pages do.
export async function loadStudentRecords(studentId: string): Promise<StudentRecords> {
  await connectDB();

  const submissions = (await Submission.find({
    student: studentId,
    status: { $in: ["In Progress", "Submitted", "Marked"] },
  }).lean()) as unknown as LeanSubmission[];

  const examIds = [...new Set(submissions.map((s) => s.exam.toString()))];
  const exams = examIds.length
    ? ((await Exam.find({ _id: { $in: examIds } })
        .populate({ path: "questions.question", select: "type marks" })
        .lean()) as unknown as LeanExam[])
    : [];
  const examById = new Map(exams.map((e) => [e._id.toString(), e]));

  // Subject names, tolerating legacy rows whose `subject` is a plain name.
  const subjectIds = exams
    .map((e) => String(e.subject ?? ""))
    .filter((v) => mongoose.Types.ObjectId.isValid(v));
  const subjects = subjectIds.length
    ? await Subject.find({ _id: { $in: subjectIds } })
        .select("name")
        .lean()
    : [];
  const subjectNameById = new Map(subjects.map((s) => [s._id.toString(), s.name]));

  const papers: { paper: PaperResult; term?: string; academicYear?: string }[] = [];

  for (const submission of submissions) {
    const exam = examById.get(submission.exam.toString());
    let ctx: PaperContext;

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
      const { objectiveTotal } = computeQuestionBreakdown(
        refs.map((r) => ({ question: r.question?._id, order: r.order })),
        metaById,
      );
      const rawSubject = String(exam.subject ?? "");
      ctx = {
        title: exam.title,
        subject: mongoose.Types.ObjectId.isValid(rawSubject)
          ? (subjectNameById.get(rawSubject) ?? "Unknown Subject")
          : rawSubject || "Unknown Subject",
        type: exam.type,
        term: exam.term,
        academicYear: exam.academicYear,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks ?? 0,
        objectiveTotal,
        objectiveQuestionIds: new Set(
          [...metaById.entries()].filter(([, m]) => m.type === "Objective").map(([id]) => id),
        ),
        deleted: false,
      };
    } else if (submission.examSnapshot) {
      const snap = submission.examSnapshot;
      ctx = {
        title: snap.title,
        subject: snap.subjectName || "Unknown Subject",
        type: snap.type,
        term: snap.term,
        academicYear: snap.academicYear,
        examDate: snap.examDate,
        totalMarks: snap.totalMarks ?? 0,
        objectiveTotal: snap.objectiveTotal ?? 0,
        deleted: true,
      };
    } else {
      // Deleted before snapshots existed: all that is known is the submission.
      ctx = {
        title: "Exam no longer available",
        subject: "Unknown Subject",
        type: "Objective",
        totalMarks: submission.totalMarks ?? 0,
        objectiveTotal: 0,
        deleted: true,
      };
    }

    const paper = buildPaper(submission, ctx);
    if (paper) papers.push({ paper, term: ctx.term, academicYear: ctx.academicYear });
  }

  const byKey = new Map<
    string,
    { term?: string; academicYear?: string; papers: PaperResult[] }
  >();
  for (const { paper, term, academicYear } of papers) {
    const key = examinationKey(academicYear, term);
    if (!byKey.has(key)) byKey.set(key, { term, academicYear, papers: [] });
    byKey.get(key)!.papers.push(paper);
  }

  const groups: ExaminationGroup[] = [...byKey.entries()].map(([key, g]) => {
    // Papers in the order they were written, then by subject.
    g.papers.sort(
      (a, b) =>
        new Date(a.examDate ?? 0).getTime() - new Date(b.examDate ?? 0).getTime() ||
        a.subject.localeCompare(b.subject),
    );
    return { summary: summariseExamination(key, g.term, g.academicYear, g.papers), papers: g.papers };
  });

  // Newest examination first (by its latest paper date); undated ones last.
  groups.sort(
    (a, b) =>
      new Date(b.summary.lastDate ?? 0).getTime() - new Date(a.summary.lastDate ?? 0).getTime(),
  );

  const allPapers = groups.flatMap((g) => g.papers);
  const markedPapers = allPapers.filter((p) => p.status === "marked" && p.percentage !== null);

  return {
    groups,
    summary: {
      papersTaken: allPapers.length,
      papersMarked: allPapers.filter((p) => p.status === "marked").length,
      papersAwaitingMarking: allPapers.filter((p) => p.status === "awaiting-marking").length,
      papersInProgress: allPapers.filter((p) => p.status === "in-progress").length,
      averagePercentage: markedPapers.length
        ? round(markedPapers.reduce((s, p) => s + (p.percentage ?? 0), 0) / markedPapers.length)
        : null,
    },
  };
}

// Whether `key` is a well-formed examination key (or the "unknown" bucket).
export function isExaminationKey(key: string): boolean {
  if (key === UNKNOWN_KEY) return true;
  const [year, termSlug] = key.split("_");
  return (
    /^\d{4}-\d{4}$/.test(year ?? "") &&
    TERMS.some((t) => t.toLowerCase().replace(/\s+/g, "-") === termSlug)
  );
}

// ---- Upcoming exams -----------------------------------------------------------

// Exams this student is eligible for - by their class, or a general exam that
// lists it - that have not finished yet and that the student has not already
// handed in. Computed from the clock, so an exam appears as soon as it is
// created for the class and disappears the moment it ends or is submitted.
export async function loadUpcomingExams(student: IStudent): Promise<UpcomingExam[]> {
  await connectDB();
  if (student.class === "graduated") return [];

  const exams = await Exam.find(examClassFilter(student.class)).sort({ examDate: 1 }).lean();
  const now = new Date();

  const open = exams
    .map((exam) => ({ exam, status: computeExamStatus(new Date(exam.examDate), exam.duration, now) }))
    .filter(({ status }) => status === "Scheduled" || status === "Ongoing");
  if (open.length === 0) return [];

  const ids = open.map(({ exam }) => exam._id);
  const mine = await Submission.find({ exam: { $in: ids }, student: student._id })
    .select("exam status")
    .lean();
  const statusByExam = new Map(mine.map((s) => [s.exam.toString(), s.status]));

  const subjectIds = open
    .map(({ exam }) => String(exam.subject ?? ""))
    .filter((v) => mongoose.Types.ObjectId.isValid(v));
  const subjects = subjectIds.length
    ? await Subject.find({ _id: { $in: subjectIds } })
        .select("name")
        .lean()
    : [];
  const subjectNameById = new Map(subjects.map((s) => [s._id.toString(), s.name]));

  return open
    .filter(({ exam }) => {
      const s = statusByExam.get(exam._id.toString());
      return s !== "Submitted" && s !== "Marked";
    })
    .map(({ exam, status }) => {
      const rawSubject = String(exam.subject ?? "");
      const start = new Date(exam.examDate);
      return {
        id: exam._id.toString(),
        title: exam.title,
        subject: mongoose.Types.ObjectId.isValid(rawSubject)
          ? (subjectNameById.get(rawSubject) ?? "Unknown Subject")
          : rawSubject || "Unknown Subject",
        type: exam.type as ExamKind,
        term: exam.term,
        academicYear: exam.academicYear,
        examDate: start.toISOString(),
        endsAt: new Date(start.getTime() + exam.duration * 60_000).toISOString(),
        duration: exam.duration,
        status: status as "Scheduled" | "Ongoing",
        isGeneral: Boolean(exam.isGeneral),
        inProgress: statusByExam.get(exam._id.toString()) === "In Progress",
      };
    });
}

export async function findStudentById(id: string): Promise<IStudent | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  return Student.findById(id);
}
