import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { decryptContent } from "@/lib/crypto";
import { SiteNav } from "@/components/site-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoomClient } from "@/app/rooms/[id]/room-client";
import { RoomActions } from "@/app/rooms/[id]/room-actions";
import { ShareButton } from "@/app/rooms/[id]/share-button";
import { RoomStatusChip } from "@/components/room-status-chip";
import { RemoveMemberButton } from "@/app/rooms/[id]/remove-member-button";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/interpolate";

// Memoized per request so generateMetadata and the page component share a
// single query instead of each fetching the same room. Selects the superset
// both consumers need.
const getRoom = cache((id: string) =>
  prisma.prayerRoom.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { user: { select: { id: true, displayName: true } } },
        orderBy: { joinedAt: "asc" },
      },
      requests: { select: { authorId: true, isConfidential: true } },
    },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const room = await getRoom(id);
  if (room?.name) return { title: room.name };
  const t = getDictionary(await getLocale());
  return { title: t.metadata.roomFallbackTitle };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());
  const { id } = await params;

  const room = await getRoom(id);

  if (!room) notFound();

  const isMember = room.memberships.some((m) => m.userId === user.id);
  if (!isMember) {
    return (
      <>
        <SiteNav user={user} />
        <main className="mx-auto max-w-2xl px-3 py-12 text-center sm:px-4">
          <h1 className="text-xl font-semibold">{t.room.notMemberTitle}</h1>
          <p className="mt-2 text-muted-foreground">
            {t.room.notMemberDescription}
          </p>
        </main>
      </>
    );
  }

  const submittedAuthorIds = new Set(room.requests.map((r) => r.authorId));
  const myExisting = await prisma.prayerRequest.findFirst({
    where: { roomId: room.id, authorId: user.id },
    select: { content: true, isConfidential: true },
  });

  // Confidential requests are never shown in this view — they only surface
  // for the assignee in /my-prayers. Show the user their own content (all
  // content is stored encrypted) if they wrote it as non-confidential.
  const myPlaintext =
    myExisting && !myExisting.isConfidential
      ? decryptContent(myExisting.content, myExisting.isConfidential)
      : null;

  const members = room.memberships.map((m) => ({
    id: m.user.id,
    displayName: m.user.displayName,
    hasSubmitted: submittedAuthorIds.has(m.user.id),
  }));

  const isOwner = room.ownerId === user.id;
  const isOpen = room.status === "OPEN";

  return (
    <>
      <SiteNav user={user} />
      <main className="max-w-5xl p-8 lg:mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">
                {room.name}
              </h1>
              <RoomStatusChip status={room.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {interpolate(t.room.roomMeta, {
                code: room.code,
                count: members.length,
                plural: members.length === 1 ? "" : "s",
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {isOpen && <ShareButton code={room.code} />}
            <RoomActions roomId={room.id} isOwner={isOwner} isOpen={isOpen} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
          <RoomClient
            roomId={room.id}
            isOwner={isOwner}
            isOpen={isOpen}
            existingContent={myPlaintext}
            existingIsConfidential={myExisting?.isConfidential ?? false}
            hasExisting={!!myExisting}
            requestsCount={room.requests.length}
            membersCount={members.length}
          />

          <aside>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.room.membersTitle}</CardTitle>
                <CardDescription>
                  {interpolate(t.room.membersSubmitted, {
                    submitted: submittedAuthorIds.size,
                    total: members.length,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {m.displayName}
                        {m.id === user.id && (
                          <span className="ml-1 text-muted-foreground">
                            {t.room.you}
                          </span>
                        )}
                        {m.id === room.ownerId && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {t.room.ownerTag}
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <span
                          className={`text-xs ${
                            m.hasSubmitted
                              ? "text-emerald-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          {m.hasSubmitted ? t.room.submitted : t.room.waiting}
                        </span>
                        {isOwner && isOpen && m.id !== user.id && (
                          <RemoveMemberButton
                            roomId={room.id}
                            userId={m.id}
                            displayName={m.displayName}
                          />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
}
