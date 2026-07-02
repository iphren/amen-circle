import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { SiteNav } from "@/components/site-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoomClient } from "@/app/rooms/[id]/room-client";
import { RoomStatusChip } from "@/components/room-status-chip";

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
  return { title: room?.name ?? "Room" };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  const { id } = await params;

  const room = await getRoom(id);

  if (!room) notFound();

  const isMember = room.memberships.some((m) => m.userId === user.id);
  if (!isMember) {
    return (
      <>
        <SiteNav user={user} />
        <main className="mx-auto max-w-2xl px-3 py-12 text-center sm:px-4">
          <h1 className="text-xl font-semibold">Not a member</h1>
          <p className="mt-2 text-muted-foreground">
            Ask the owner to share the room code with you.
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

  // Confidential requests stay encrypted in this view — they only get decrypted
  // for the assignee in /my-prayers. Show the user their own raw content if
  // they wrote it as non-confidential, otherwise hide it.
  const myPlaintext =
    myExisting && !myExisting.isConfidential ? myExisting.content : null;

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
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">
                {room.name}
              </h1>
              <RoomStatusChip status={room.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Code <code className="font-mono">{room.code}</code> · {members.length}{" "}
              member{members.length === 1 ? "" : "s"}
            </p>
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
                <CardTitle className="text-base">Members</CardTitle>
                <CardDescription>
                  {submittedAuthorIds.size} of {members.length} have submitted
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
                            (you)
                          </span>
                        )}
                        {m.id === room.ownerId && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            · owner
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-xs ${
                          m.hasSubmitted
                            ? "text-emerald-700"
                            : "text-muted-foreground"
                        }`}
                      >
                        {m.hasSubmitted ? "✓ submitted" : "waiting"}
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
