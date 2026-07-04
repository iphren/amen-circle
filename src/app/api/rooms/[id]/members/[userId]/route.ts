import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

// Owner-only member removal (moderation). Mirrors the leave route: the
// target's request is dropped so it can't be assigned, then their membership
// goes. Only while the room is OPEN — after close, assignments exist and
// removal would break them.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const t = getDictionary(await resolveRequestLocale());

  const { id: roomId, userId: targetUserId } = await params;

  const room = await prisma.prayerRoom.findUnique({
    where: { id: roomId },
    include: { memberships: { select: { userId: true } } },
  });
  if (!room) {
    return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
  }
  if (room.ownerId !== auth.userId) {
    return NextResponse.json(
      { error: t.errors.onlyOwnerCanRemove },
      { status: 403 },
    );
  }
  if (room.status !== "OPEN") {
    return NextResponse.json({ error: t.errors.roomClosed }, { status: 400 });
  }
  if (targetUserId === room.ownerId) {
    return NextResponse.json(
      { error: t.errors.ownerCannotBeRemoved },
      { status: 400 },
    );
  }
  if (!room.memberships.some((m) => m.userId === targetUserId)) {
    return NextResponse.json({ error: t.errors.notAMember }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.prayerRequest.deleteMany({
      where: { roomId, authorId: targetUserId },
    }),
    prisma.membership.delete({
      where: { userId_roomId: { userId: targetUserId, roomId } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
