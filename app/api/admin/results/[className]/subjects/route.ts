import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guards";
import type { ClassLevel } from "@/lib/models/constants";
import { getSubjectResultsForClass } from "@/lib/results-helpers";

// GET /api/admin/results/[className]/subjects
export async function GET(req: NextRequest, context: { params: Promise<{ className: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { className } = await context.params;
  const subjects = await getSubjectResultsForClass(decodeURIComponent(className) as ClassLevel);

  return NextResponse.json({ subjects, className });
}
