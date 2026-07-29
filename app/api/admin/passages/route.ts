import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Passage } from "@/lib/models/passage.model";

// GET /api/admin/passages?subject=&class=&kind=
// Lists passages for browsing/attaching from the Question Bank - same
// subject+class filter shape as the question bank list, so the admin UI
// can reuse the existing filter bar pattern.
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

  return NextResponse.json({ passages });
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
