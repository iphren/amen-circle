import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UserWithPasskeys = Prisma.UserGetPayload<{
  include: { passkeys: true };
}>;

export type SignupUserResult =
  // A real account: enrolling a passkey into it (or re-recording consent) from
  // an unauthenticated request would be account takeover. The caller decides
  // how to respond (409, or quietly emailing a sign-in link).
  | { status: "complete"; user: UserWithPasskeys }
  // Fresh signup, or an interrupted one being resumed; displayName and consent
  // timestamps have been (re-)recorded as of this attempt.
  | { status: "resumable"; user: UserWithPasskeys };

// An account is "complete" once it can be signed into: it has a passkey, or
// its email was verified by consuming an emailed single-use token. Anything
// else is an interrupted signup that unauthenticated registration may resume.
// Loose != null so a user object selected without the field reads as unverified.
export function isCompleteAccount(user: {
  passkeys: unknown[];
  emailVerifiedAt?: Date | null;
}): boolean {
  return user.passkeys.length > 0 || user.emailVerifiedAt != null;
}

// Find-or-create the user row for a registration attempt, keying the
// "already taken" decision on account completeness, not mere row existence.
// Registration is the point where we record the demonstrable consent UK GDPR
// requires; resumable rows get displayName and all consent timestamps
// refreshed. Returns null only when a concurrent-create race can't be
// recovered (row vanished between the P2002 and the re-fetch).
export async function findOrCreateSignupUser(
  email: string,
  displayName: string,
): Promise<SignupUserResult | null> {
  const consentNow = new Date();
  const consentData = {
    termsAcceptedAt: consentNow,
    religiousDataConsentAt: consentNow,
    ageConfirmedAt: consentNow,
  };

  let user = await prisma.user.findUnique({
    where: { email },
    include: { passkeys: true },
  });

  if (user && isCompleteAccount(user)) {
    return { status: "complete", user };
  }

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { displayName, ...consentData },
      include: { passkeys: true },
    });
  } else {
    try {
      user = await prisma.user.create({
        data: { email, displayName, ...consentData },
        include: { passkeys: true },
      });
    } catch (e) {
      // Concurrent signup with the same email raced us to create the row.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        user = await prisma.user.findUnique({
          where: { email },
          include: { passkeys: true },
        });
        if (user && isCompleteAccount(user)) {
          return { status: "complete", user };
        }
        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { displayName, ...consentData },
            include: { passkeys: true },
          });
        }
      } else {
        throw e;
      }
    }
  }

  if (!user) return null;
  return { status: "resumable", user };
}
