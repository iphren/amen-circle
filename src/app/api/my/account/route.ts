import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { getSession } from "@/lib/session";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";
import { interpolate } from "@/lib/i18n/interpolate";

// Full account erasure (UK GDPR Art. 17). PrayerRequest.authorId,
// PrayerRequest.assignedToId and PrayerRoom.ownerId have no onDelete
// behaviour (Restrict), so the transaction clears those references in order
// before the user row can go. Deleting owned rooms cascades their
// memberships and requests; deleting the user cascades passkeys, tokens and
// remaining memberships. Owned rooms are deleted rather than transferred —
// disclosed in the terms.
export async function DELETE() {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  await prisma.$transaction([
    prisma.prayerRequest.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null },
    }),
    prisma.prayerRequest.deleteMany({ where: { authorId: userId } }),
    prisma.prayerRoom.deleteMany({ where: { ownerId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  const session = await getSession();
  session.destroy();

  return NextResponse.json({ ok: true });
}

const MAX_NAME_LENGTH = 60;

// Rename the current user. displayName has no DB length constraint, so the
// bound is enforced here (matching the passkey rename limit).
export async function PATCH(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const t = getDictionary(await resolveRequestLocale());

  const body = await req.json().catch(() => null);
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : "";
  if (!displayName || displayName.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      {
        error: interpolate(t.errors.displayNameLength, {
          max: MAX_NAME_LENGTH,
        }),
      },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: { displayName },
    select: { displayName: true },
  });

  return NextResponse.json(updated);
}
