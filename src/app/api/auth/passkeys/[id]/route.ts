import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const passkey = await prisma.passkey.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  // Treat "not yours" and "doesn't exist" identically so we don't leak which
  // credential ids exist.
  if (!passkey || passkey.userId !== auth.userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const count = await prisma.passkey.count({ where: { userId: auth.userId } });
  if (count <= 1) {
    return NextResponse.json(
      {
        error:
          "You can't remove your only passkey. Add a backup first, or use account recovery.",
      },
      { status: 409 },
    );
  }

  await prisma.passkey.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

const MAX_NAME_LENGTH = 60;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const passkey = await prisma.passkey.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  // Same "not yours" == "doesn't exist" treatment as DELETE so we don't leak
  // which credential ids exist.
  if (!passkey || passkey.userId !== auth.userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Name must be 1–${MAX_NAME_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const updated = await prisma.passkey.update({
    where: { id },
    data: { name },
    select: { id: true, name: true },
  });

  return NextResponse.json(updated);
}
