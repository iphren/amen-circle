import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  RECOVERY_TTL_MS,
  generateRecoveryToken,
} from "@/lib/recovery-token";
import { sendRecoveryEmail } from "@/lib/email";
import { origin } from "@/lib/webauthn";

interface RecoverStartBody {
  email?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as RecoverStartBody;
  const email = body.email?.trim().toLowerCase();

  // Always respond identically regardless of whether the account exists, so the
  // endpoint can't be used to enumerate registered emails.
  const genericOk = NextResponse.json({ ok: true });

  if (!email) return genericOk;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) return genericOk;

  // Invalidate any outstanding recovery tokens for this user, then mint a fresh
  // single-use one.
  const { raw, hash } = generateRecoveryToken();
  await prisma.$transaction([
    prisma.recoveryToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.recoveryToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + RECOVERY_TTL_MS),
      },
    }),
  ]);

  const recoverUrl = `${origin}/auth/recover?token=${encodeURIComponent(raw)}`;
  try {
    await sendRecoveryEmail({ to: user.email, recoverUrl });
  } catch (err) {
    // Don't surface send failures to the caller (would leak account existence
    // and isn't actionable for them). Log for operators.
    console.error("recovery email send failed", err);
  }

  return genericOk;
}
