import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "./auth";
import { connectDB } from "./db";
import { Staff, IStaff } from "./models/staff.model";
import type { ClassLevel } from "./models/constants";

type GuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

// Wrap the start of any admin-only route handler with:
//
//   const guard = await requireAdmin();
//   if (!guard.ok) return guard.response;
//   const { session } = guard;
export async function requireAdmin(): Promise<GuardResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "admin") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, session };
}

export async function requireStudent(): Promise<GuardResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "student") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, session };
}

// Any logged-in staff member (teacher or non-teaching) - use this for
// endpoints every staff member should reach, e.g. their own dashboard.
export async function requireStaff(): Promise<GuardResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "staff") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, session };
}

// Staff members whose role is specifically "teacher" - gates Question
// Management and Result Viewing, which non-teaching staff don't get.
export async function requireTeacher(): Promise<GuardResult> {
  const guard = await requireStaff();
  if (!guard.ok) return guard;
  if (guard.session.user.staffRole !== "teacher") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return guard;
}

type ScopeResult =
  | { ok: true; staff: IStaff }
  | { ok: false; response: NextResponse };

// Loads the signed-in teacher's Staff document and, if subject/class are
// given, confirms they're actually assigned both - a teacher can only add
// questions for or view results of a subject+class pair they've been
// assigned (see Subject and Class Assignment in the admin staff routes).
// Call this from every teacher-facing route that touches a specific
// subject or class, not just requireTeacher() alone.
export async function assertTeacherScope(
  staffId: string,
  subjectId?: string,
  classLevel?: ClassLevel,
): Promise<ScopeResult> {
  await connectDB();
  const staff = await Staff.findById(staffId);
  if (!staff || !staff.isActive || staff.role !== "teacher") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (subjectId) {
    const hasSubject = staff.assignedSubjects.some((s) => s.toString() === subjectId);
    if (!hasSubject) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "You are not assigned to this subject" },
          { status: 403 },
        ),
      };
    }
  }

  if (classLevel) {
    const hasClass = staff.assignedClasses.includes(classLevel);
    if (!hasClass) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "You are not assigned to this class" },
          { status: 403 },
        ),
      };
    }
  }

  return { ok: true, staff };
}
