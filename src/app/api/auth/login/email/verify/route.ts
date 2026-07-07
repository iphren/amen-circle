import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashRecoveryToken } from "@/lib/recovery-token";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";
import { sendWelcomeEmail } from "@/lib/email";
import { origin } from "@/lib/webauthn";

interface LoginEmailVerifyBody {
  token?: string;
}

// Consume a raw email sign-in token and log the user in. Unlike recovery, this
// grants a session directly — no passkey ceremony.
export async function POST(req: Request) {
  const requestLocale = await resolveRequestLocale();
  const t = getDictionary(requestLocale);
  const body = (await req.json()) as LoginEmailVerifyBody;
  const raw = body.token?.trim();

  const invalid = NextResponse.json(
    { error: t.errors.signInLinkInvalid },
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

  // Consuming an emailed token proves ownership of the address. This is what
  // completes an email-based registration (see /api/auth/register/email/start):
  // a verified zero-passkey account is no longer a claimable interrupted signup.
  // A count of 1 means this consumption is what first set emailVerifiedAt (vs.
  // an already-verified user reusing this same route for an ordinary sign-in).
  const verified = await prisma.user.updateMany({
    where: { id: token.userId, emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });

  if (verified.count === 1) {
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { email: true },
    });
    if (user) {
      after(() =>
        sendWelcomeEmail({
          to: user.email,
          appUrl: `${origin}/dashboard`,
          locale: requestLocale,
        }).catch((err) => console.error("welcome email send failed", err)),
      );
    }
  }

  const session = await getSession();
  session.userId = token.userId;
  delete session.challenge;
  delete session.pendingUserId;
  await session.save();

  return NextResponse.json({ ok: true });
}
