import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Passage } from "@/lib/models/passage.model";
import { Question } from "@/lib/models/question.model";

// GET /api/admin/passages?subject=&class=&kind=
// Lists passages for browsing/attaching from the Question Bank - same
// subject+class filter shape as the question bank list, so the admin UI
// can reuse the existing filter bar pattern.
//
// Each passage comes back with a questionCount - how many bank questions
// currently reference it. The admin UI uses this to auto-number a newly
// attached sub-question's passageOrder (questionCount + 1) instead of
// asking the admin to track or type a number by eye, which matters more
// than usual here since the admin bank UI is used non-visually.
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");
  const classLevel = searchParams.get("class");
  const kind = searchParams.get("kind");

  const filter: Record<string, unknown> = {};
  if (subject) filter.subject = subject;
  if (classLevel) filter.class = classLevel;
  if (kind) filter.kind = kind;

  const passages = await Passage.find(filter).sort({ createdAt: -1 });

  const counts = await Question.aggregate([
    { $match: { passageId: { $in: passages.map((p) => p._id) } } },
    { $group: { _id: "$passageId", count: { $sum: 1 } } },
  ]);
  const countByPassageId = new Map(counts.map((c) => [c._id.toString(), c.count as number]));

  const passagesWithCounts = passages.map((p) => ({
    ...p.toObject(),
    questionCount: countByPassageId.get((p._id as { toString(): string }).toString()) ?? 0,
  }));

  return NextResponse.json({ passages: passagesWithCounts });
}

interface NewPassageInput {
  title?: string;
  text?: string;
  kind?: string;
  subject?: string;
  class?: string;
}

// POST /api/admin/passages
// Creates a standalone passage. Sub-questions attach to it afterwards via
// Question.passageId - this route only ever creates the passage itself,
// same two-step shape as creating a Subject before tagging questions with
// it, rather than trying to create a passage and its questions in one call.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();

  const body = (await req.json()) as NewPassageInput;

  const passage = new Passage({
    title: body.title,
    text: body.text,
    kind: body.kind,
    subject: body.subject,
    class: body.class,
    createdBy: guard.session.user.id,
  });

  try {
    await passage.validate();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid passage";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await passage.save();

  return NextResponse.json({ passage }, { status: 201 });
}
