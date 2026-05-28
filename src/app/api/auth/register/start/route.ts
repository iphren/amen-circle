import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rpID, rpName } from "@/lib/webauthn";

interface RegisterStartBody {
  email?: string;
  displayName?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as RegisterStartBody;
  const email = body.email?.trim().toLowerCase();
  const displayName = body.displayName?.trim();

  if (!email || !displayName) {
    return NextResponse.json(
      { error: "email and displayName required" },
      { status: 400 },
    );
  }

  const user =
    (await prisma.user.findUnique({
      where: { email },
      include: { passkeys: true },
    })) ??
    (await prisma.user.create({
      data: { email, displayName },
      include: { passkeys: true },
    }));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userID: new TextEncoder().encode(user.id),
    userDisplayName: user.displayName,
    attestationType: "none",
    excludeCredentials: user.passkeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const session = await getSession();
  session.challenge = options.challenge;
  session.pendingUserId = user.id;
  await session.save();

  return NextResponse.json(options);
}
