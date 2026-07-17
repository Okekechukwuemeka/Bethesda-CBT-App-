import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Student } from "@/lib/models/student.model";

// GET /api/admin/students/[id]
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  await connectDB();

  const student = await Student.findById(id);
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  return NextResponse.json({ student });
}

const EDITABLE_FIELDS = ["firstName", "lastName", "class", "gender", "isActive"] as const;

// PATCH /api/admin/students/[id]
// Body: any subset of { firstName, lastName, class, gender, isActive }
// Password is never editable here - that's a separate reset flow (a
// dedicated POST /api/admin/students/[id]/reset-password endpoint would be
// the right place for that, not a silent field update).
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
    const student = await Student.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    return NextResponse.json({ student });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update student";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/students/[id]
// Hard delete. If you'd rather keep exam history intact for a student who
// leaves, consider using PATCH { isActive: false } instead in your UI and
// reserving this for genuine mistakes (e.g. a duplicate record).
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  await connectDB();

  const student = await Student.findByIdAndDelete(id);
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  return NextResponse.json({ deleted: true });
}
