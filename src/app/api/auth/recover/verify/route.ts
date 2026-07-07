import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashRecoveryToken } from "@/lib/recovery-token";
import { buildEnrollmentOptions } from "@/lib/passkey-enroll";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

interface RecoverVerifyBody {
  token?: string;
}

// Exchange a raw recovery token for a pending enrollment session. On success
// this consumes the token and returns WebAuthn options so the browser can
// enroll a fresh passkey. The existing (lost) passkeys are kept until
// /api/auth/recover/finish swaps them out atomically — that avoids ever leaving
// the account in a zero-passkey state an unauthenticated register could claim.
export async function POST(req: Request) {
  const t = getDictionary(await resolveRequestLocale());
  const body = (await req.json()) as RecoverVerifyBody;
  const raw = body.token?.trim();

  const invalid = NextResponse.json(
    { error: t.errors.recoveryLinkInvalid },
    { status: 400 },
  );

  if (!raw) return invalid;

  const token = await prisma.recoveryToken.findUnique({
    where: { tokenHash: hashRecoveryToken(raw) },
    select: { id: true, userId: true },
  });
  if (!token) return invalid;

  // Atomically claim the token: only succeeds if it's still unused and unexpired,
  // which also serializes concurrent uses of the same link.
  const claimed = await prisma.recoveryToken.updateMany({
    where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return invalid;

  // Consuming an emailed token proves ownership of the address — same
  // semantics as login/email/verify, kept uniform across both token kinds.
  await prisma.user.updateMany({
    where: { id: token.userId, emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });

  const { options, challenge } = await buildEnrollmentOptions(token.userId);

  const session = await getSession();
  session.challenge = challenge;
  session.pendingUserId = token.userId;
  await session.save();

  return NextResponse.json(options);
}
