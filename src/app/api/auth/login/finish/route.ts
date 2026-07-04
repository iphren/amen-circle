import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rpID, origin } from "@/lib/webauthn";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

export async function POST(req: Request) {
  const t = getDictionary(await resolveRequestLocale());
  const response = (await req.json()) as AuthenticationResponseJSON;
  const session = await getSession();

  if (!session.challenge) {
    return NextResponse.json({ error: t.errors.noPendingLogin }, { status: 400 });
  }

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: response.id },
  });

  if (!passkey) {
    return NextResponse.json({ error: t.errors.unknownCredential }, { status: 400 });
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: session.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: passkey.credentialId,
      publicKey: new Uint8Array(passkey.publicKey),
      counter: Number(passkey.counter),
      transports: passkey.transports as AuthenticatorTransportFuture[],
    },
  });

  if (!verification.verified) {
    return NextResponse.json({ error: t.errors.verificationFailed }, { status: 400 });
  }

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: BigInt(verification.authenticationInfo.newCounter) },
  });

  session.userId = passkey.userId;
  delete session.challenge;
  await session.save();

  return NextResponse.json({ ok: true });
}
