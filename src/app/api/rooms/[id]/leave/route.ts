import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const { id: roomId } = await params;

  const room = await prisma.prayerRoom.findUnique({
    where: { id: roomId },
    include: { memberships: { select: { userId: true } } },
  });
  if (!room) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (room.status !== "OPEN") {
    return NextResponse.json({ error: "room is closed" }, { status: 400 });
  }
  if (room.ownerId === auth.userId) {
    return NextResponse.json(
      { error: "owner must cancel the room, not leave" },
      { status: 403 },
    );
  }
  if (!room.memberships.some((m) => m.userId === auth.userId)) {
    return NextResponse.json({ error: "not a member" }, { status: 403 });
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
