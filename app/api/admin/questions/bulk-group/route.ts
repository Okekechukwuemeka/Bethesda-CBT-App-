import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Question } from "@/lib/models/question.model";
import { buildQuestionFilter } from "@/lib/question-filter";
import { normalizeGroupName, resolveGroupName, validateGroupName } from "@/lib/question-groups";

const MAX_IDS = 5000;

// POST /api/admin/questions/bulk-group
// Body: { group: string, ids: string[] }              - the listed questions
//   or  { group: string, filter: { type?, subject?, class?, search?, group? } }
//                                                      - EVERY question matching
//                                                        those list filters
// Moves existing questions into a group (creating it if it's new). This is
// how older, ungrouped questions get organised. It only changes `group`.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const body = await req.json().catch(() => ({}));

  const group = normalizeGroupName(body.group);
  const groupError = validateGroupName(group);
  if (groupError) return NextResponse.json({ error: groupError }, { status: 400 });

  let match: Record<string, unknown>;
  if (Array.isArray(body.ids)) {
    const ids: string[] = body.ids.filter((id: unknown) => typeof id === "string");
    if (ids.length === 0) {
      return NextResponse.json({ error: "No questions were selected." }, { status: 400 });
    }
    if (ids.length > MAX_IDS || !ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return NextResponse.json({ error: "Invalid list of question ids." }, { status: 400 });
    }
    match = { _id: { $in: ids } };
  } else if (body.filter && typeof body.filter === "object") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(body.filter)) {
      if (typeof value === "string" && value) params.set(key, value);
    }
    match = buildQuestionFilter(params);
  } else {
    return NextResponse.json(
      { error: "Provide either the selected question ids or the filters to apply." },
      { status: 400 },
    );
  }

  const resolved = await resolveGroupName(group);
  const result = await Question.updateMany(match, { $set: { group: resolved } }, { timestamps: false });

  return NextResponse.json({ updated: result.modifiedCount, matched: result.matchedCount, group: resolved });
}
