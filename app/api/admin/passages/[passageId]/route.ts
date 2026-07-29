import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Passage } from "@/lib/models/passage.model";
import { Question } from "@/lib/models/question.model";

interface PatchPassageInput {
  title?: string;
  text?: string;
}

// PATCH /api/admin/passages/[passageId]
// Deliberately narrow: only title/text are editable here. subject, class,
// and kind are NOT - changing those after sub-questions already exist
// against this passage would silently move it out of the bank scope those
// questions were created under. Re-scoping a passage (and everything
// attached to it) is a bigger, more deliberate operation than this
// endpoint is meant to cover.
export async function PATCH(req: NextRequest, context: { params: Promise<{ passageId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { passageId } = await context.params;
  await connectDB();

  const passage = await Passage.findById(passageId);
  if (!passage) return NextResponse.json({ error: "Passage not found" }, { status: 404 });

  const body = (await req.json()) as PatchPassageInput;
  if (body.title !== undefined) passage.title = body.title;
  if (body.text !== undefined) passage.text = body.text;

  try {
    await passage.save();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update passage";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ passage });
}

// DELETE /api/admin/passages/[passageId]
// Blocked (409) if any question still references it - no force override.
// Unlike exam deletion's "force past existing submissions" pattern, there's
// no safe "delete anyway" here: an orphaned Question.passageId would break
// the student exam-taking flow the moment a session tries to look up a
// passage that no longer exists. The dependent questions have to be
// reassigned or deleted first, from the question bank.
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ passageId: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { passageId } = await context.params;
  await connectDB();

  const passage = await Passage.findById(passageId);
  if (!passage) return NextResponse.json({ error: "Passage not found" }, { status: 404 });

  // Capped sample for the "blocked by" message (mirrors deleteBlockedExams
  // on the question-delete flow) - the count below is the real total, this
  // is just enough to show the admin a few concrete examples.
  const [dependentCount, sampleQuestions] = await Promise.all([
    Question.countDocuments({ passageId }),
    Question.find({ passageId }).select("text").limit(5),
  ]);

  if (dependentCount > 0) {
    return NextResponse.json(
      {
        error: `This passage still has ${dependentCount} question${
          dependentCount === 1 ? "" : "s"
        } attached to it. Remove or reassign them before deleting the passage.`,
        blockedByQuestions: sampleQuestions.map((q) => ({ id: q._id, text: q.text })),
      },
      { status: 409 },
    );
  }

  await passage.deleteOne();

  return NextResponse.json({ deleted: true });
}
