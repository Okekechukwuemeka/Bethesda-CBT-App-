import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Admin } from "@/lib/models/admin.model";

// POST /api/admin/register
// Body: { username, password, firstName, lastName, setupSecret? }
//
// Two modes, chosen automatically based on whether any admin exists yet:
//
// 1. BOOTSTRAP (Admin collection is empty): there's no one to log in as,
//    so this can't require an admin session - that would make it
//    impossible to ever create the first account. Instead it requires
//    `setupSecret` to match process.env.ADMIN_SETUP_SECRET, so the route
//    isn't wide open to the public internet during that window. Set
//    ADMIN_SETUP_SECRET in your .env, use it once to create the first
//    admin, then you can leave it in place (it becomes inert once mode 2
//    kicks in) or remove it.
//
// 2. NORMAL (one or more admins already exist): requires a logged-in
//    admin session, same as every other /api/admin/* route. setupSecret
//    is ignored in this mode.
export async function POST(req: NextRequest) {
  await connectDB();

  const existingAdminCount = await Admin.countDocuments();
  const body = await req.json();

  if (existingAdminCount > 0) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
  } else {
    const expectedSecret = process.env.ADMIN_SETUP_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: "ADMIN_SETUP_SECRET is not configured on the server - cannot bootstrap" },
        { status: 500 },
      );
    }
    if (body.setupSecret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid or missing setup secret" }, { status: 403 });
    }
  }

  try {
    const admin = await Admin.create({
      username: body.username,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    return NextResponse.json(
      {
        admin: {
          id: admin.id,
          username: admin.username,
          firstName: admin.firstName,
          lastName: admin.lastName,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register admin";
    const isDuplicate = message.includes("duplicate key");
    return NextResponse.json(
      { error: isDuplicate ? "That username is already taken" : message },
      { status: 400 },
    );
  }
}
