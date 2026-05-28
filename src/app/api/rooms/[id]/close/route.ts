import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { assignRequestsToMembers } from "@/lib/assign";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const { id: roomId } = await params;

  const room = await prisma.prayerRoom.findUnique({
    where: { id: roomId },
    include: {
      memberships: { select: { userId: true } },
      requests: { select: { id: true, authorId: true } },
    },
  });
  if (!room) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (room.ownerId !== auth.userId) {
    return NextResponse.json({ error: "owner only" }, { status: 403 });
  }
  if (room.status !== "OPEN") {
    return NextResponse.json({ error: "already closed" }, { status: 400 });
  }
  if (room.memberships.length < 2) {
    return NextResponse.json(
      { error: "need at least 2 members" },
      { status: 422 },
    );
  }
  if (room.requests.length === 0) {
    return NextResponse.json(
      { error: "no requests to assign" },
      { status: 422 },
    );
  }

  const memberIds = room.memberships.map((m) => m.userId);
  const assignments = assignRequestsToMembers(room.requests, memberIds);
  if (!assignments) {
    return NextResponse.json(
      { error: "could not generate valid assignment" },
      { status: 422 },
    );
  }

  await prisma.$transaction([
    ...Array.from(assignments.entries()).map(([requestId, assigneeId]) =>
      prisma.prayerRequest.update({
        where: { id: requestId },
        data: { assignedToId: assigneeId },
      }),
    ),
    prisma.prayerRoom.update({
      where: { id: roomId },
      data: { status: "CLOSED", closedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
