import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { decrypt } from "@/lib/crypto";

export async function GET() {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const rows = await prisma.prayerRequest.findMany({
    where: { assignedToId: auth.userId },
    include: {
      author: { select: { id: true, displayName: true } },
      room: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const out = rows.map((r) => ({
    id: r.id,
    roomId: r.roomId,
    roomName: r.room.name,
    isConfidential: r.isConfidential,
    content: r.isConfidential ? decrypt(r.content) : r.content,
    author: r.isConfidential ? null : r.author,
    createdAt: r.createdAt,
    prayedAt: r.prayedAt,
  }));

  return NextResponse.json(out);
}
