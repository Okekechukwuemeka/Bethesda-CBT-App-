import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Staff } from "@/lib/models/staff.model";

// GET /api/admin/staff/[id]
// Returns full personal + professional record, including assignments.
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  await connectDB();

  const staff = await Staff.findById(id).populate("assignedSubjects", "name code");
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  return NextResponse.json({ staff });
}

const EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "gender",
  "role",
  "isActive",
] as const;

// PATCH /api/admin/staff/[id]
// Body: any subset of the editable fields above. Username and password
// are never editable here - password reset would be a separate dedicated
// endpoint, and username changes would break the staff member's login
// muscle memory for no real benefit.
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  await connectDB();
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  try {
    const staff = await Staff.findById(id);
    if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    Object.assign(staff, updates);
    await staff.save(); // runs the non_teaching -> clears assignments rule

    return NextResponse.json({ staff });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update staff member";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/staff/[id]
// Hard delete. If you'd rather preserve history for a staff member who
// leaves, use PATCH { isActive: false } instead and reserve this for
// genuine mistakes (e.g. a duplicate record) - same convention as students.
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  await connectDB();

  const staff = await Staff.findByIdAndDelete(id);
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  return NextResponse.json({ deleted: true });
}
