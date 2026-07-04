import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { encryptContent } from "@/lib/crypto";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

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
  const t = getDictionary(await resolveRequestLocale());

  const { id: roomId } = await params;
  const body = (await req.json()) as CreateRequestBody;
  const content = body.content?.trim();
  const isConfidential = !!body.isConfidential;

  if (!content) {
    return NextResponse.json({ error: t.errors.contentRequired }, { status: 400 });
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
    return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
  }
  if (room.memberships.length === 0) {
    return NextResponse.json({ error: t.errors.notAMember }, { status: 403 });
  }
  if (room.status !== "OPEN") {
    return NextResponse.json({ error: t.errors.roomClosed }, { status: 400 });
  }

  // All content is encrypted at rest; isConfidential is purely a visibility
  // flag (hide author identity / reveal-to-pray UI).
  const stored = encryptContent(content);

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
