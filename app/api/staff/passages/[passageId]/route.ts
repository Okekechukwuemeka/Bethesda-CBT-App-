import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { Passage } from "@/lib/models/passage.model";
import { Question } from "@/lib/models/question.model";

// A teacher may only change a passage they created themselves, and only
// while its subject+class is still within their current assignment.
async function loadOwnedPassage(passageId: string, staffId: string) {
  const passage = await Passage.findById(passageId);
  if (!passage) {
    return { error: NextResponse.json({ error: "Passage not found" }, { status: 404 }) };
  }

  if (passage.createdByModel !== "Staff" || passage.createdBy.toString() !== staffId) {
    return {
      error: NextResponse.json(
        { error: "You can only change passages you created yourself" },
        { status: 403 },
      ),
    };
  }

  const scope = await assertTeacherScope(staffId, passage.subject.toString(), passage.class);
  if (!scope.ok) return { error: scope.response };

  return { passage };
}

// PATCH /api/staff/passages/[passageId]
// Only title/text are editable (same rule as the admin route).
export async function PATCH(req: NextRequest, context: { params: Promise<{ passageId: string }> }) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const { passageId } = await context.params;
  await connectDB();

  const { passage, error } = await loadOwnedPassage(passageId, guard.session.user.id);
  if (error) return error;

  const body = await req.json();
  if (body.title !== undefined) passage!.title = body.title;
  if (body.text !== undefined) passage!.text = body.text;

  try {
    await passage!.save();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update passage";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ passage });
}

// DELETE /api/staff/passages/[passageId]
// Blocked (409) while any question still references it, same as admin.
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ passageId: string }> },
) {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;

  const { passageId } = await context.params;
  await connectDB();

  const { passage, error } = await loadOwnedPassage(passageId, guard.session.user.id);
  if (error) return error;

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

  await passage!.deleteOne();

  return NextResponse.json({ deleted: true });
}
