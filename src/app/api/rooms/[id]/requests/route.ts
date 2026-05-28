import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { encrypt } from "@/lib/crypto";

interface CreateRequestBody {
  content?: string;
  isConfidential?: boolean;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const { id: roomId } = await params;
  const body = (await req.json()) as CreateRequestBody;
  const content = body.content?.trim();
  const isConfidential = !!body.isConfidential;

  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const room = await prisma.prayerRoom.findUnique({
    where: { id: roomId },
    select: {
      status: true,
      memberships: {
        where: { userId: auth.userId },
        select: { userId: true },
      },
    },
  });
  if (!room) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (room.memberships.length === 0) {
    return NextResponse.json({ error: "not a member" }, { status: 403 });
  }
  if (room.status !== "OPEN") {
    return NextResponse.json({ error: "room is closed" }, { status: 400 });
  }

  const stored = isConfidential ? encrypt(content) : content;

  const existing = await prisma.prayerRequest.findFirst({
    where: { roomId, authorId: auth.userId },
    select: { id: true },
  });

  const saved = existing
    ? await prisma.prayerRequest.update({
        where: { id: existing.id },
        data: { content: stored, isConfidential },
        select: { id: true },
      })
    : await prisma.prayerRequest.create({
        data: {
          roomId,
          authorId: auth.userId,
          content: stored,
          isConfidential,
        },
        select: { id: true },
      });

  return NextResponse.json(saved);
}
