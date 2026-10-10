import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam, examClassFilter } from "@/lib/models/exam.model";
import { Subject } from "@/lib/models/subject.model";
import { ClassLevel, ExamType, ExamStatus, Term, EXAM_STATUSES } from "@/lib/models/constants";
import { examStatusFilter, syncAllExamStatuses, syncExamStatus } from "@/lib/exam-status";
import { buildPagination, parsePageRequest } from "@/lib/pagination";
import type { PaginationInfo } from "@/lib/pagination";

// GET /api/admin/exams
//   ?class=JSS1 &subject=<id> &term=First+Term &type=Objective &status=Ongoing
//   &search=<text> &dateFrom=<ISO> &dateTo=<ISO> &page=1 &pageSize=12
//
// Filters (all optional, all combinable):
//  - class: class-specific exams for it, plus general exams it's eligible for
//  - search: matches exam title, exam code, or subject name
//  - dateFrom / dateTo: inclusive range on the exam's date/time. Sent as full
//    ISO timestamps (the browser turns the admin's local calendar days into
//    their exact start/end instants) so the range is right in any timezone.
//  - status: Scheduled / Ongoing / Completed, evaluated against the clock
//
// Sorted newest exam first. Without `page`/`pageSize` the complete list is
// returned as before; with them the response also carries `pagination`.
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const params = req.nextUrl.searchParams;

  const classFilter = params.get("class") as ClassLevel | null;
  const subjectFilter = params.get("subject");
  const termFilter = params.get("term") as Term | null;
  const typeFilter = params.get("type") as ExamType | null;
  const statusFilter = params.get("status") as ExamStatus | null;
  const search = params.get("search")?.trim();
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");

  if (subjectFilter && !mongoose.Types.ObjectId.isValid(subjectFilter)) {
    return NextResponse.json({ error: "Invalid subject filter" }, { status: 400 });
  }
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;
  if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) {
    return NextResponse.json({ error: "Invalid date filter" }, { status: 400 });
  }

  // Combined with $and because several of these need a top-level $or
  // (class matching, search) and would otherwise overwrite one another.
  const conditions: Record<string, unknown>[] = [];
  if (classFilter) conditions.push(examClassFilter(classFilter));
  if (subjectFilter) conditions.push({ subject: subjectFilter });
  if (termFilter) conditions.push({ term: termFilter });
  if (typeFilter) conditions.push({ type: typeFilter });
  if (fromDate || toDate) {
    conditions.push({
      examDate: { ...(fromDate ? { $gte: fromDate } : {}), ...(toDate ? { $lte: toDate } : {}) },
    });
  }
  if (statusFilter && EXAM_STATUSES.includes(statusFilter)) {
    conditions.push(examStatusFilter(statusFilter));
  }
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const matchingSubjects = await Subject.find({ name: pattern }).select("_id").lean();
    conditions.push({
      $or: [
        { title: pattern },
        { examCode: pattern },
        ...(matchingSubjects.length > 0
          ? [{ subject: { $in: matchingSubjects.map((s) => s._id) } }]
          : []),
      ],
    });
  }
  const filter = conditions.length > 0 ? { $and: conditions } : {};

  // Keep every exam's stored status current, not just the page returned -
  // see syncAllExamStatuses.
  await syncAllExamStatuses();

  const pageRequest = parsePageRequest(params, 12, 50);
  let pagination: PaginationInfo | undefined;

  // Deliberately .lean() + resolve subject names ourselves here, instead
  // of .populate("subject", "name code"): populate (like any normal
  // query) casts every document's `subject` to ObjectId as it hydrates
  // results, and throws for the ENTIRE list if even one legacy/corrupt
  // document has a raw string there instead of a real ref. .lean() skips
  // that hydration step entirely, so one bad row degrades gracefully
  // instead of taking down the whole exams page.
  // _id is a tie-breaker so exams sharing a date keep a stable order across pages.
  let query = Exam.find(filter).sort({ examDate: -1, _id: -1 });
  if (pageRequest.paginated) {
    const total = await Exam.countDocuments(filter);
    pagination = buildPagination(total, pageRequest.page, pageRequest.pageSize);
    query = query.skip((pagination.page - 1) * pagination.pageSize).limit(pagination.pageSize);
  }
  const exams = await query.lean();

  const validSubjectIds = Array.from(
    new Set(
      exams
        .map((e) => e.subject)
        .filter((s): s is mongoose.Types.ObjectId =>
          mongoose.Types.ObjectId.isValid(s as unknown as string),
        )
        .map((s) => s.toString()),
    ),
  );
  const subjectDocs = await Subject.find({ _id: { $in: validSubjectIds } })
    .select("name code")
    .lean();
  const subjectById = new Map(subjectDocs.map((s) => [s._id.toString(), s]));

  const examsWithResolvedSubject = exams.map((exam) => {
    const raw = exam.subject as unknown;
    const asString = String(raw ?? "");
    const resolved = mongoose.Types.ObjectId.isValid(asString)
      ? (subjectById.get(asString) ?? null)
      : null;
    return {
      ...exam,
      subject: resolved ?? { name: asString || "Unknown subject", code: "" },
    };
  });

  // Status was brought up to date above; this also covers a malformed
  // legacy exam (left with whatever status it has) and the narrow window
  // where an exam crossed a boundary since that sync.
  await Promise.all(
    examsWithResolvedSubject.map(async (exam) => {
      exam.status = await syncExamStatus(exam);
    }),
  );

  return NextResponse.json({ exams: examsWithResolvedSubject, ...(pagination ? { pagination } : {}) });
}

// POST /api/admin/exams
// Body: { title, subject, term, academicYear, type, examDate, duration,
// instructions?, passingScore?, shuffleQuestions?, isGeneral?,
// class?, classes?  }
// A class-specific exam (the default, isGeneral falsy) sends `class`.
// A general exam - one exam multiple classes can sit, e.g. a scholarship
// or aptitude test - sends `isGeneral: true` and `classes: string[]`
// instead; `class` is ignored in that case (the model clears it anyway).
// examCode is auto-generated by the Exam model's pre-save hook. status is
// intentionally NOT accepted here - it's always computed from
// examDate/duration (see lib/exam-status.ts), so a brand-new exam starts
// out as whatever computeExamStatus naturally derives (almost always
// "Scheduled" for a future date, but this stays correct even for a
// same-day exam created after its start time).
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const body = await req.json();
  const isGeneral = Boolean(body.isGeneral);

  try {
    const exam = await Exam.create({
      title: body.title,
      subject: body.subject,
      isGeneral,
      class: isGeneral ? undefined : body.class,
      classes: isGeneral ? body.classes : undefined,
      term: body.term,
      academicYear: body.academicYear,
      type: body.type,
      examDate: body.examDate,
      duration: body.duration,
      instructions: body.instructions,
      objectiveInstructions: body.objectiveInstructions,
      theoryInstructions: body.theoryInstructions,
      passingScore: body.passingScore,
      shuffleQuestions: body.shuffleQuestions,
      createdBy: guard.session.user.id,
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create exam";
    // Duplicate exam (same subject+class+term+academicYear+type) hits the
    // unique index defined on the Exam schema.
    const isDuplicate = message.includes("duplicate key");
    return NextResponse.json(
      {
        error: isDuplicate
          ? isGeneral
            ? "A general exam with this title already exists for this subject/term"
            : "An exam like this already exists for this class/term"
          : message,
      },
      { status: 400 },
    );
  }
}
