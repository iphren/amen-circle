import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const request = await prisma.prayerRequest.findUnique({
    where: { id },
    select: { id: true, authorId: true },
  });

  // Treat "not yours" and "doesn't exist" identically so we don't leak which
  // request ids exist.
  if (!request || request.authorId !== auth.userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.answered !== "boolean") {
    return NextResponse.json(
      { error: "answered must be a boolean" },
      { status: 400 },
    );
  }

  const updated = await prisma.prayerRequest.update({
    where: { id },
    data: { answeredAt: body.answered ? new Date() : null },
    select: { id: true, answeredAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const request = await prisma.prayerRequest.findUnique({
    where: { id },
    select: { id: true, authorId: true },
  });

  // Same "not yours" == "doesn't exist" treatment as PATCH.
  if (!request || request.authorId !== auth.userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.prayerRequest.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
