import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStaff } from "@/lib/api-guards";
import { Staff } from "@/lib/models/staff.model";

// GET /api/staff/me
// Powers the staff portal's own dashboard - profile info plus (for
// teachers) their assigned subjects/classes, so the UI can build its nav
// and empty states without a second round trip.
export async function GET() {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  await connectDB();
  const staff = await Staff.findById(guard.session.user.id).populate(
    "assignedSubjects",
    "name code",
  );
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  return NextResponse.json({ staff });
}
