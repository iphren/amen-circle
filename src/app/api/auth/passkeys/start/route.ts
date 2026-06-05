import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { requireUserId } from "@/lib/auth-guard";
import { buildEnrollmentOptions } from "@/lib/passkey-enroll";

// Authenticated "add a backup passkey" — enrolls an additional credential onto
// the currently signed-in account.
export async function POST() {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const { options, challenge } = await buildEnrollmentOptions(auth.userId);

  const session = await getSession();
  session.challenge = challenge;
  await session.save();

  return NextResponse.json(options);
}
