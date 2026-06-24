import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashRecoveryToken } from "@/lib/recovery-token";

interface LoginEmailVerifyBody {
  token?: string;
}

// Consume a raw email sign-in token and log the user in. Unlike recovery, this
// grants a session directly — no passkey ceremony.
export async function POST(req: Request) {
  const body = (await req.json()) as LoginEmailVerifyBody;
  const raw = body.token?.trim();

  const invalid = NextResponse.json(
    { error: "This sign-in link is invalid or has expired." },
    { status: 400 },
  );

  if (!raw) return invalid;

  const token = await prisma.loginToken.findUnique({
    where: { tokenHash: hashRecoveryToken(raw) },
    select: { id: true, userId: true },
  });
  if (!token) return invalid;

  // Atomically claim the token: only succeeds if it's still unused and unexpired,
  // which also serializes concurrent uses of the same link.
  const claimed = await prisma.loginToken.updateMany({
    where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return invalid;

  const session = await getSession();
  session.userId = token.userId;
  delete session.challenge;
  delete session.pendingUserId;
  await session.save();

  return NextResponse.json({ ok: true });
}
