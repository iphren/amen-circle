import { NextResponse, after } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { verifyAndStorePasskey } from "@/lib/passkey-enroll";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";
import { sendWelcomeEmail } from "@/lib/email";
import { origin } from "@/lib/webauthn";

export async function POST(req: Request) {
  const requestLocale = await resolveRequestLocale();
  const t = getDictionary(requestLocale);
  const response = (await req.json()) as RegistrationResponseJSON;
  const session = await getSession();

  if (!session.challenge || !session.pendingUserId) {
    return NextResponse.json(
      { error: t.errors.noPendingRegistration },
      { status: 400 },
    );
  }

  const pendingUserId = session.pendingUserId;

  const result = await verifyAndStorePasskey({
    userId: pendingUserId,
    response,
    expectedChallenge: session.challenge,
  });

  if (!result.ok) {
    return NextResponse.json({ error: t.errors.verificationFailed }, { status: 400 });
  }

  session.userId = pendingUserId;
  delete session.challenge;
  delete session.pendingUserId;
  await session.save();

  // register/start only sets pendingUserId for a non-"complete" account (see
  // findOrCreateSignupUser), so reaching here always means this passkey
  // enrollment is what completed a brand-new signup.
  const user = await prisma.user.findUnique({
    where: { id: pendingUserId },
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

  return NextResponse.json({ ok: true });
}
