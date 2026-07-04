import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { generateRoomCode } from "@/lib/room-code";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

interface CreateRoomBody {
  name?: string;
}

export async function POST(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const t = getDictionary(await resolveRequestLocale());

  const body = (await req.json()) as CreateRoomBody;
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: t.errors.nameRequired }, { status: 400 });
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode();
    try {
      const room = await prisma.prayerRoom.create({
        data: {
          name,
          code,
          ownerId: auth.userId,
          memberships: { create: { userId: auth.userId } },
        },
        select: { id: true, code: true, name: true },
      });
      return NextResponse.json(room);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        continue;
      }
      throw e;
    }
  }

  return NextResponse.json(
    { error: t.errors.couldNotGenerateCode },
    { status: 500 },
  );
}
