import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getSession } from "@/lib/session";
import { rpID } from "@/lib/webauthn";

export async function POST() {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });

  const session = await getSession();
  session.challenge = options.challenge;
  await session.save();

  return NextResponse.json(options);
}
