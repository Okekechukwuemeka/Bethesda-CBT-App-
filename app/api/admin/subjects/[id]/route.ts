import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Subject } from "@/lib/models/subject.model";

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/admin/subjects/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid subject id" }, { status: 400 });
  }

  await connectDB();
  const subject = await Subject.findById(id);
  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({ subject });
}

// PATCH /api/admin/subjects/:id
// Body: any subset of { name, code, description, isActive }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid subject id" }, { status: 400 });
  }

  await connectDB();
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.code !== undefined) updates.code = body.code;
  if (body.description !== undefined) updates.description = body.description;
  if (body.isActive !== undefined) updates.isActive = body.isActive;

  try {
    const subject = await Subject.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json({ subject });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update subject";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/subjects/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid subject id" }, { status: 400 });
  }

  await connectDB();
  const subject = await Subject.findByIdAndDelete(id);

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
