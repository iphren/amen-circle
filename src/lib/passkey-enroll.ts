import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rpID, rpName, origin } from "@/lib/webauthn";

/**
 * Shared WebAuthn passkey-enrollment ceremony, used by three callers that all
 * attach a credential to a known user: first-time registration, authenticated
 * "add a backup passkey", and account recovery. Each caller is responsible for
 * resolving *which* user is enrolling (and for any authorization) — these
 * helpers only run the ceremony for the userId they are handed.
 */

export async function buildEnrollmentOptions(
  userId: string,
): Promise<{ options: PublicKeyCredentialCreationOptionsJSON; challenge: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { passkeys: true },
  });
  if (!user) throw new Error(`buildEnrollmentOptions: user ${userId} not found`);

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

  return { options, challenge: options.challenge };
}

export async function verifyAndStorePasskey(args: {
  userId: string;
  response: RegistrationResponseJSON;
  expectedChallenge: string;
  // Recovery: atomically drop the user's existing (lost/compromised) passkeys
  // and insert the new one in a single transaction, so the account is never
  // left in a zero-passkey state that an unauthenticated register could claim.
  replaceExisting?: boolean;
}): Promise<{ ok: true; passkeyId: string } | { ok: false }> {
  const verification = await verifyRegistrationResponse({
    response: args.response,
    expectedChallenge: args.expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false };
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  const data: Prisma.PasskeyCreateInput = {
    user: { connect: { id: args.userId } },
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey),
    counter: BigInt(credential.counter),
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: credential.transports ?? [],
  };

  const passkeyId = args.replaceExisting
    ? await prisma.$transaction(async (tx) => {
        await tx.passkey.deleteMany({ where: { userId: args.userId } });
        const created = await tx.passkey.create({ data, select: { id: true } });
        return created.id;
      })
    : (await prisma.passkey.create({ data, select: { id: true } })).id;

  return { ok: true, passkeyId };
}
