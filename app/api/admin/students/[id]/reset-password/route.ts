import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Student } from "@/lib/models/student.model";
import { generateTemporaryPassword } from "@/lib/password-reset";

// POST /api/admin/students/[id]/reset-password
//
// Students have no self-service recovery. When one forgets their password, an
// ADMIN resets it here: a fresh temporary password is generated, stored only as
// a bcrypt hash (the Student model's pre-save hook), and returned ONCE so the
// admin can hand it to the student. It cannot be retrieved again afterwards.
//
// Admin-only (requireAdmin) - staff and students get 403.
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  await connectDB();
  const student = await Student.findById(id).select("+password");
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  try {
    const tempPassword = generateTemporaryPassword(student.firstName, student.lastName);
    student.password = tempPassword; // hashed by the model's pre-save hook
    await student.save();

    return NextResponse.json({
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      tempPassword,
    });
  } catch (error) {
    console.error("[students/reset-password]", error);
    return NextResponse.json({ error: "Could not reset the password. Please try again." }, { status: 500 });
  }
}
