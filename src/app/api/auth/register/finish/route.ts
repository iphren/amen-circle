import { NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { getSession } from "@/lib/session";
import { verifyAndStorePasskey } from "@/lib/passkey-enroll";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

export async function POST(req: Request) {
  const t = getDictionary(await resolveRequestLocale());
  const response = (await req.json()) as RegistrationResponseJSON;
  const session = await getSession();

  if (!session.challenge || !session.pendingUserId) {
    return NextResponse.json(
      { error: t.errors.noPendingRegistration },
      { status: 400 },
    );
  }

  const result = await verifyAndStorePasskey({
    userId: session.pendingUserId,
    response,
    expectedChallenge: session.challenge,
  });

  if (!result.ok) {
    return NextResponse.json({ error: t.errors.verificationFailed }, { status: 400 });
  }

  session.userId = session.pendingUserId;
  delete session.challenge;
  delete session.pendingUserId;
  await session.save();

  return NextResponse.json({ ok: true });
}
