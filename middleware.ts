import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public (unauthenticated) paths within each role's route tree - these
// must NOT be protected, or visiting them while logged out would redirect
// to themselves and loop forever.
const ADMIN_PUBLIC_PATHS = ["/admin/login"];
const STUDENT_PUBLIC_PATHS = ["/student/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as "admin" | "student" | undefined;

  const isApiRoute = pathname.startsWith("/api/");

  const isAdminRoute =
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    !ADMIN_PUBLIC_PATHS.includes(pathname);

  const isStudentRoute =
    (pathname.startsWith("/student") || pathname.startsWith("/api/student")) &&
    !STUDENT_PUBLIC_PATHS.includes(pathname);

  if (isAdminRoute && role !== "admin") {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (isStudentRoute && role !== "student") {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/student/login", req.url));
  }

  // Already-logged-in users shouldn't sit on a login page - bounce them
  // to their own dashboard instead.
  if (pathname === "/admin/login" && role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (pathname === "/student/login" && role === "student") {
    return NextResponse.redirect(new URL("/student", req.url));
  }

  return NextResponse.next();
}

// Run on everything except static assets/Next internals, and let
// /api/auth/* (NextAuth's own sign-in/sign-out/callback routes) through
// untouched.
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
