import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { assignRequestsToMembers } from "@/lib/assign";
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
    include: {
      memberships: { select: { userId: true } },
      requests: { select: { id: true, authorId: true } },
    },
  });
  if (!room) {
    return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
  }
  if (room.ownerId !== auth.userId) {
    return NextResponse.json({ error: t.errors.ownerOnly }, { status: 403 });
  }
  if (room.status !== "OPEN") {
    return NextResponse.json({ error: t.errors.alreadyClosed }, { status: 400 });
  }
  if (room.memberships.length < 2) {
    return NextResponse.json(
      { error: t.errors.needTwoMembers },
      { status: 422 },
    );
  }
  if (room.requests.length === 0) {
    return NextResponse.json(
      { error: t.errors.noRequestsToAssign },
      { status: 422 },
    );
  }

  const memberIds = room.memberships.map((m) => m.userId);
  const assignments = assignRequestsToMembers(room.requests, memberIds);
  if (!assignments) {
    return NextResponse.json(
      { error: t.errors.couldNotGenerateAssignment },
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
