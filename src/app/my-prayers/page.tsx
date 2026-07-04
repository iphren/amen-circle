import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { decryptContent } from "@/lib/crypto";
import { SiteNav } from "@/components/site-nav";
import { RevealableContent } from "@/components/revealable-content";
import { UserChip } from "@/components/user-chip";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OPERATOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "My prayers",
};

export default async function MyPrayersPage() {
  const user = await requireCurrentUser();

  const rows = await prisma.prayerRequest.findMany({
    where: { assignedToId: user.id },
    include: {
      author: { select: { displayName: true } },
      room: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const items = rows.map((r) => ({
    id: r.id,
    roomId: r.roomId,
    roomName: r.room.name,
    isConfidential: r.isConfidential,
    content: decryptContent(r.content, r.isConfidential),
    authorName: r.author.displayName,
    createdAt: r.createdAt,
  }));

  return (
    <>
      <SiteNav user={user} />
      <main className="max-w-5xl p-6 sm:p-8 lg:mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">My prayers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests entrusted to you across all your rooms.
        </p>

        {items.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            Nothing here yet. Once a room you&apos;re in is closed, requests
            assigned to you will show up here.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {items.map((it) => (
              <li key={it.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex min-w-0 items-center justify-between gap-2 text-base">
                      <Link
                        href={`/rooms/${it.roomId}`}
                        className="min-w-0 truncate hover:underline"
                      >
                        {it.roomName}
                      </Link>
                      {it.isConfidential && (
                        <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          confidential
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-1.5">
                      From <UserChip name={it.authorName} /> ·{" "}
                      {formatDate(it.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <RevealableContent
                      content={it.content}
                      isConfidential={it.isConfidential}
                    />
                    {/* The only place users see others' content, so the
                        report route lives here (see terms §6). */}
                    <a
                      className="self-end text-xs text-muted-foreground hover:underline"
                      href={`mailto:${OPERATOR.contactEmail}?subject=${encodeURIComponent(
                        `Report content — request ${it.id}`,
                      )}`}
                    >
                      Report
                    </a>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
