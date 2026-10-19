import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Admin } from "@/lib/models/admin.model";
import { sendEmailAddressUpdatedEmail } from "@/lib/mailer";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/admin/me - the signed-in admin's own account details.
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const admin = await Admin.findById(guard.session.user.id);
  if (!admin) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json({
    admin: {
      id: admin.id,
      username: admin.username,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email ?? "",
    },
  });
}

// PATCH /api/admin/me
// Body: { email: string, currentPassword: string }
//
// Sets the admin's recovery email - the address password-reset codes go to.
// Changing it needs the CURRENT password, so someone who finds an admin's
// logged-in browser can't quietly redirect future reset codes to themselves.
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = (await req.json().catch(() => null)) as {
    email?: unknown;
    currentPassword?: unknown;
  } | null;

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!currentPassword) {
    return NextResponse.json(
      { error: "Please enter your current password to confirm this change." },
      { status: 400 },
    );
  }

  await connectDB();
  const admin = await Admin.findById(guard.session.user.id).select("+password");
  if (!admin) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (!(await admin.comparePassword(currentPassword))) {
    return NextResponse.json({ error: "Your current password is not correct." }, { status: 400 });
  }

  try {
    admin.email = email;
    await admin.save();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "That email address is already used by another administrator." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not save the email address." }, { status: 400 });
  }

  // Best effort: lets the owner of the new address know it is now the
  // recovery address. A mail failure must not undo a saved change.
  void sendEmailAddressUpdatedEmail({ to: email, firstName: admin.firstName });

  return NextResponse.json({ email: admin.email });
}
