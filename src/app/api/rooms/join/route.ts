import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";

interface JoinBody {
  code?: string;
}

export async function POST(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as JoinBody;
  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const room = await prisma.prayerRoom.findUnique({ where: { code } });
  if (!room) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  if (room.status === "CLOSED") {
    return NextResponse.json({ error: "room is closed" }, { status: 400 });
  }

  await prisma.membership.upsert({
    where: { userId_roomId: { userId: auth.userId, roomId: room.id } },
    create: { userId: auth.userId, roomId: room.id },
    update: {},
  });

  return NextResponse.json({ ok: true, roomId: room.id });
}
