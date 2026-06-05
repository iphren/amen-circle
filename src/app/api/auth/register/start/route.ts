import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildEnrollmentOptions } from "@/lib/passkey-enroll";

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
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 },
    );
  }

  if (!user) {
    try {
      user = await prisma.user.create({
        data: { email, displayName },
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
            {
              error:
                "An account with this email already exists. Please sign in.",
            },
            { status: 409 },
          );
        }
      } else {
        throw e;
      }
    }
  }

  if (!user) {
    return NextResponse.json(
      { error: "could not start registration" },
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
