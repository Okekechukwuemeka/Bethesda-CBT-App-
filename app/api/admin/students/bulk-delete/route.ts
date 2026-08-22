import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Student } from "@/lib/models/student.model";

// POST /api/admin/students/bulk-delete
// Body: { ids: string[] }
// Hard delete, same trade-off as the single DELETE /api/admin/students/[id]
// route - no soft-delete/undo here, that's what PATCH { isActive: false }
// is for if you want to keep exam history for students who leave.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const body = await req.json();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "No student ids provided" }, { status: 400 });
  }

  const result = await Student.deleteMany({ _id: { $in: ids } });
  return NextResponse.json({ deletedCount: result.deletedCount });
}
