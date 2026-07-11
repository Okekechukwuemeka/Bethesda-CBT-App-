import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "./auth";

type GuardResult = { ok: true; session: Session } | { ok: false; response: NextResponse };

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
