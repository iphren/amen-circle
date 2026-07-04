import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";

// List the signed-in user's passkeys for the /settings manager.
export async function GET() {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const passkeys = await prisma.passkey.findMany({
    where: { userId: auth.userId },
    select: {
      id: true,
      deviceType: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(passkeys);
}
