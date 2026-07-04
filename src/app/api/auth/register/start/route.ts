import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildEnrollmentOptions } from "@/lib/passkey-enroll";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

interface RegisterStartBody {
  email?: string;
  displayName?: string;
  acceptTerms?: boolean;
  consentReligiousData?: boolean;
}

export async function POST(req: Request) {
  const t = getDictionary(await resolveRequestLocale());
  const body = (await req.json()) as RegisterStartBody;
  const email = body.email?.trim().toLowerCase();
  const displayName = body.displayName?.trim();

  if (!email || !displayName) {
    return NextResponse.json(
      { error: t.errors.emailAndDisplayNameRequired },
      { status: 400 },
    );
  }

  // Enforced server-side, not just in the UI: registration is the point where
  // we record the demonstrable consent UK GDPR requires. acceptTerms covers
  // terms + 18+ age confirmation; consentReligiousData is the unbundled
  // Art. 9(2)(a) explicit consent for prayer content.
  if (body.acceptTerms !== true || body.consentReligiousData !== true) {
    return NextResponse.json(
      { error: t.errors.mustAcceptTermsToRegister },
      { status: 400 },
    );
  }

  const consentNow = new Date();
  const consentData = {
    termsAcceptedAt: consentNow,
    religiousDataConsentAt: consentNow,
    ageConfirmedAt: consentNow,
  };

  // Find-or-create, but key the "already taken" decision on passkey count, not
  // mere user existence. A user row with zero passkeys is an interrupted signup
  // that may resume; a row WITH passkeys is a real account — enrolling a passkey
  // into it from an unauthenticated request would be account takeover. Adding a
  // passkey to an existing account must go through the authenticated /settings
  // flow (or account recovery) instead.
  let user = await prisma.user.findUnique({
    where: { email },
    include: { passkeys: true },
  });

  if (user && user.passkeys.length > 0) {
    return NextResponse.json(
      { error: t.errors.accountExists },
      { status: 409 },
    );
  }

  if (user) {
    // Resumed interrupted signup: refresh the display name and re-record
    // consent as of this attempt.
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
        if (user && user.passkeys.length > 0) {
          return NextResponse.json(
            { error: t.errors.accountExists },
            { status: 409 },
          );
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

  if (!user) {
    return NextResponse.json(
      { error: t.errors.couldNotStartRegistration },
      { status: 500 },
    );
  }

  const { options, challenge } = await buildEnrollmentOptions(user.id);

  const session = await getSession();
  session.challenge = challenge;
  session.pendingUserId = user.id;
  await session.save();

  return NextResponse.json(options);
}
