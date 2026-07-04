import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { getSession } from "@/lib/session";

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
