import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const t = getDictionary(await resolveRequestLocale());

  const { id: roomId } = await params;

  const room = await prisma.prayerRoom.findUnique({
    where: { id: roomId },
    include: { memberships: { select: { userId: true } } },
  });
  if (!room) {
    return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
  }
  if (room.status !== "OPEN") {
    return NextResponse.json({ error: t.errors.roomClosed }, { status: 400 });
  }
  if (room.ownerId === auth.userId) {
    return NextResponse.json(
      { error: t.errors.ownerMustCancel },
      { status: 403 },
    );
  }
  if (!room.memberships.some((m) => m.userId === auth.userId)) {
    return NextResponse.json({ error: t.errors.notAMember }, { status: 403 });
  }

  // Drop the member's own request so it can't be assigned once they're gone,
  // then remove their membership.
  await prisma.$transaction([
    prisma.prayerRequest.deleteMany({
      where: { roomId, authorId: auth.userId },
    }),
    prisma.membership.delete({
      where: { userId_roomId: { userId: auth.userId, roomId } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
