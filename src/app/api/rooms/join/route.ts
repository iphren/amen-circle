import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

interface JoinBody {
  code?: string;
}

export async function POST(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const t = getDictionary(await resolveRequestLocale());

  const body = (await req.json()) as JoinBody;
  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: t.errors.codeRequired }, { status: 400 });
  }

  const room = await prisma.prayerRoom.findUnique({ where: { code } });
  if (!room) {
    return NextResponse.json({ error: t.errors.roomNotFound }, { status: 404 });
  }
  if (room.status === "CLOSED") {
    return NextResponse.json({ error: t.errors.roomClosed }, { status: 400 });
  }

  await prisma.membership.upsert({
    where: { userId_roomId: { userId: auth.userId, roomId: room.id } },
    create: { userId: auth.userId, roomId: room.id },
    update: {},
  });

  return NextResponse.json({ ok: true, roomId: room.id });
}
