import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rpID, origin } from "@/lib/webauthn";

export async function POST(req: Request) {
  const response = (await req.json()) as RegistrationResponseJSON;
  const session = await getSession();

  if (!session.challenge || !session.pendingUserId) {
    return NextResponse.json(
      { error: "no pending registration" },
      { status: 400 },
    );
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: session.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "verification failed" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  await prisma.passkey.create({
    data: {
      userId: session.pendingUserId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.transports ?? [],
    },
  });

  session.userId = session.pendingUserId;
  delete session.challenge;
  delete session.pendingUserId;
  await session.save();

  return NextResponse.json({ ok: true });
}
