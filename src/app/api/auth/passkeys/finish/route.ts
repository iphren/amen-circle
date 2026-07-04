import { NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { getSession } from "@/lib/session";
import { requireUserId } from "@/lib/auth-guard";
import { verifyAndStorePasskey } from "@/lib/passkey-enroll";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

export async function POST(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const t = getDictionary(await resolveRequestLocale());

  const response = (await req.json()) as RegistrationResponseJSON;
  const session = await getSession();

  if (!session.challenge) {
    return NextResponse.json({ error: t.errors.noPendingEnrollment }, { status: 400 });
  }

  const result = await verifyAndStorePasskey({
    userId: auth.userId,
    response,
    expectedChallenge: session.challenge,
  });

  if (!result.ok) {
    return NextResponse.json({ error: t.errors.verificationFailed }, { status: 400 });
  }

  // The user is already signed in; only clear the transient challenge.
  delete session.challenge;
  await session.save();

  return NextResponse.json({ ok: true, passkeyId: result.passkeyId });
}
