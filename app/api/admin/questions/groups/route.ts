import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { listQuestionGroups } from "@/lib/question-groups";

// GET /api/admin/questions/groups?subject=<id>&class=JSS1
// The question groups in the bank with how many questions each holds, newest
// first, plus how many questions have no group. subject/class are optional
// and narrow the counts (the exam question picker passes the exam's own).
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const params = req.nextUrl.searchParams;
  const subject = params.get("subject");
  const classFilter = params.get("class");

  if (subject && !mongoose.Types.ObjectId.isValid(subject)) {
    return NextResponse.json({ error: "Invalid subject filter" }, { status: 400 });
  }

  const match: Record<string, unknown> = {};
  if (subject) match.subject = new mongoose.Types.ObjectId(subject);
  if (classFilter) match.class = classFilter;

  return NextResponse.json(await listQuestionGroups(match));
}
