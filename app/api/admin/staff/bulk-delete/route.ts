import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Staff } from "@/lib/models/staff.model";

// POST /api/admin/staff/bulk-delete
// Body: { ids: string[] }
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const body = await req.json();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "No staff ids provided" }, { status: 400 });
  }

  const result = await Staff.deleteMany({ _id: { $in: ids } });
  return NextResponse.json({ deletedCount: result.deletedCount });
}
