import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PUBLIC_PATHS = ["/admin/login"];
const ADMIN_PUBLIC_API_PATHS = ["/api/admin/register"];
const STUDENT_PUBLIC_PATHS = ["/student/login"];
const STAFF_PUBLIC_PATHS = ["/staff/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Explicitly bypass NextAuth endpoints early.
  // NextAuth needs raw access to /api/auth/session, /api/auth/csrf, etc.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as "admin" | "student" | "staff" | undefined;

  const isApiRoute = pathname.startsWith("/api/");

  const isAdminRoute =
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    !ADMIN_PUBLIC_PATHS.includes(pathname) &&
    !ADMIN_PUBLIC_API_PATHS.includes(pathname);

  const isStudentRoute =
    (pathname.startsWith("/student") || pathname.startsWith("/api/student")) &&
    !STUDENT_PUBLIC_PATHS.includes(pathname);

  const isStaffRoute =
    (pathname.startsWith("/staff") || pathname.startsWith("/api/staff")) &&
    !STAFF_PUBLIC_PATHS.includes(pathname);

  if (isAdminRoute && role !== "admin") {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (isStudentRoute && role !== "student") {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/student/login", req.url));
  }

  if (isStaffRoute && role !== "staff") {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/staff/login", req.url));
  }

  if (pathname === "/admin/login" && role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (pathname === "/student/login" && role === "student") {
    return NextResponse.redirect(new URL("/student", req.url));
  }
  if (pathname === "/staff/login" && role === "staff") {
    return NextResponse.redirect(new URL("/staff", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
