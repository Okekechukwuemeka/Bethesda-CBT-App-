import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/lib/models/subject.model";
import "@/lib/models/passage.model";
import { requireAdmin } from "@/lib/api-guards";
import { Question } from "@/lib/models/question.model";
import { ClassLevel, QuestionType } from "@/lib/models/constants";
import { buildPagination, parsePageRequest } from "@/lib/pagination";
import type { PaginationInfo } from "@/lib/pagination";

// GET /api/admin/questions?type=Objective&subject=<id>&class=JSS1&search=photosynthesis
//   &page=1&pageSize=20
// Filters are all direct fields on Question now that it's a standalone
// bank entity - no join through Exam needed.
//
// Pagination is opt-in: with `page`/`pageSize` the response is one page plus
// a `pagination` block (filters apply to the whole bank first, then it is
// paged); without them the complete filtered list is returned exactly as
// before, which the exam question picker still relies on.
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const params = req.nextUrl.searchParams;

  const filter: Record<string, unknown> = {};
  const type = params.get("type") as QuestionType | null;
  const subject = params.get("subject");
  const classFilter = params.get("class") as ClassLevel | null;
  const search = params.get("search")?.trim();

  if (type) filter.type = type;
  if (subject) filter.subject = subject;
  if (classFilter) filter.class = classFilter;
  if (search) {
    filter.text = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  const pageRequest = parsePageRequest(params, 20, 100);
  let pagination: PaginationInfo | undefined;

  // _id as a tie-breaker so questions created in the same instant (e.g. a
  // bulk import) keep a stable order from one page to the next.
  let query = Question.find(filter)
    .populate("subject", "name code")
    .populate("passageId")
    .sort({ createdAt: -1, _id: -1 });

  if (pageRequest.paginated) {
    const total = await Question.countDocuments(filter);
    pagination = buildPagination(total, pageRequest.page, pageRequest.pageSize);
    query = query.skip((pagination.page - 1) * pagination.pageSize).limit(pagination.pageSize);
  }

  const questions = await query;

  return NextResponse.json({ questions, ...(pagination ? { pagination } : {}) });
}

// POST /api/admin/questions
// Body: { text, type, subject, class, marks, options?, correctAnswer?,
// passageId?, passageOrder? }
// Creates a single bank question. To use it in an exam, attach it via
// POST /api/admin/exams/[examId]/questions with its returned id.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const body = await req.json();

  try {
    const question = await Question.create({
      text: body.text,
      type: body.type,
      subject: body.subject,
      class: body.class,
      marks: body.marks,
      options: body.options,
      correctAnswer: body.correctAnswer,
      passageId: body.passageId,
      passageOrder: body.passageOrder,
      createdBy: guard.session.user.id,
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create question";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
