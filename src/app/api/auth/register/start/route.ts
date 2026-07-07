import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildEnrollmentOptions } from "@/lib/passkey-enroll";
import { findOrCreateSignupUser } from "@/lib/signup";
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

  // Enrolling a passkey into a complete account from an unauthenticated
  // request would be account takeover. Adding a passkey to an existing account
  // must go through the authenticated /settings flow (or account recovery).
  const result = await findOrCreateSignupUser(email, displayName);

  if (result?.status === "complete") {
    return NextResponse.json(
      { error: t.errors.accountExists },
      { status: 409 },
    );
  }

  if (!result) {
    return NextResponse.json(
      { error: t.errors.couldNotStartRegistration },
      { status: 500 },
    );
  }

  const { options, challenge } = await buildEnrollmentOptions(result.user.id);

  const session = await getSession();
  session.challenge = challenge;
  session.pendingUserId = result.user.id;
  await session.save();

  return NextResponse.json(options);
}
