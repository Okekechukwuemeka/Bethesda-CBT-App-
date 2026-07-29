import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/lib/models/subject.model";
import "@/lib/models/passage.model";
import { requireAdmin } from "@/lib/api-guards";
import { Question } from "@/lib/models/question.model";
import { ClassLevel, QuestionType } from "@/lib/models/constants";

// GET /api/admin/questions?type=Objective&subject=<id>&class=JSS1&search=photosynthesis
// Filters are all direct fields on Question now that it's a standalone
// bank entity - no join through Exam needed.
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

  const questions = await Question.find(filter)
    .populate("subject", "name code")
    .populate("passageId")
    .sort({ createdAt: -1 });

  return NextResponse.json({ questions });
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
