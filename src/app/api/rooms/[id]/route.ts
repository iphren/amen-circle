import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const t = getDictionary(await resolveRequestLocale());

  const { id } = await params;

  const room = await prisma.prayerRoom.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, displayName: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      requests: { select: { authorId: true } },
    },
  });

  if (!room) {
    return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
  }

  const isMember = room.memberships.some((m) => m.userId === auth.userId);
  if (!isMember) {
    return NextResponse.json({ error: t.errors.forbidden }, { status: 403 });
  }

  const submittedAuthorIds = new Set(room.requests.map((r) => r.authorId));
  const members = room.memberships.map((m) => ({
    id: m.user.id,
    displayName: m.user.displayName,
    hasSubmitted: submittedAuthorIds.has(m.user.id),
    joinedAt: m.joinedAt,
  }));

  return NextResponse.json({
    id: room.id,
    name: room.name,
    code: room.code,
    ownerId: room.ownerId,
    status: room.status,
    createdAt: room.createdAt,
    closedAt: room.closedAt,
    isOwner: room.ownerId === auth.userId,
    youHaveSubmitted: submittedAuthorIds.has(auth.userId),
    members,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const t = getDictionary(await resolveRequestLocale());

  const { id } = await params;

  const room = await prisma.prayerRoom.findUnique({ where: { id } });
  if (!room) {
    return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
  }
  if (room.ownerId !== auth.userId) {
    return NextResponse.json({ error: t.errors.ownerOnly }, { status: 403 });
  }
  if (room.status !== "OPEN") {
    return NextResponse.json({ error: t.errors.roomClosed }, { status: 400 });
  }

  // Cascades in the schema remove memberships and requests along with the room.
  await prisma.prayerRoom.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
