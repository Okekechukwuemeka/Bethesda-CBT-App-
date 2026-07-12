import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Subject } from "@/lib/models/subject.model";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const search = params.get("search")?.trim();

  const filter: Record<string, unknown> = {};
  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: pattern }, { code: pattern }];
  }

  const subjects = await Subject.find(filter).sort({ name: 1 });
  return NextResponse.json({ subjects });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();
  const body = await req.json();

  try {
    const subject = await Subject.create({
      name: body.name,
      code: body.code,
      description: body.description,
    });
    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create subject";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
