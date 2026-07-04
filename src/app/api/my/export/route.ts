import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { decryptContent } from "@/lib/crypto";

// Data export (UK GDPR Art. 15/20): everything we hold about the requesting
// user, as a downloadable JSON attachment. Requests merely *assigned* to the
// user are listed by id/room only — their content is other people's
// special-category data, not the requester's.
export async function GET() {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      email: true,
      displayName: true,
      createdAt: true,
      termsAcceptedAt: true,
      religiousDataConsentAt: true,
      ageConfirmedAt: true,
      passkeys: {
        select: {
          name: true,
          deviceType: true,
          backedUp: true,
          transports: true,
          createdAt: true,
        },
      },
      memberships: {
        select: {
          joinedAt: true,
          room: { select: { id: true, name: true, status: true } },
        },
      },
      ownedRooms: {
        select: { id: true, name: true, status: true, createdAt: true },
      },
      authoredRequests: {
        select: {
          id: true,
          content: true,
          isConfidential: true,
          createdAt: true,
          room: { select: { id: true, name: true } },
        },
      },
      assignedRequests: {
        select: {
          id: true,
          createdAt: true,
          prayedAt: true,
          room: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
    consent: {
      termsAcceptedAt: user.termsAcceptedAt,
      religiousDataConsentAt: user.religiousDataConsentAt,
      ageConfirmedAt: user.ageConfirmedAt,
    },
    passkeys: user.passkeys,
    memberships: user.memberships,
    ownedRooms: user.ownedRooms,
    prayerRequests: user.authoredRequests.map((r) => ({
      id: r.id,
      room: r.room,
      isConfidential: r.isConfidential,
      content: decryptContent(r.content, r.isConfidential),
      createdAt: r.createdAt,
    })),
    // Content omitted: it belongs to the authors, not the exporting user.
    requestsAssignedToYou: user.assignedRequests,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="amen-circle-export.json"',
    },
  });
}
