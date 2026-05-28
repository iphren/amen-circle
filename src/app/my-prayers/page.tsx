import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { decrypt } from "@/lib/crypto";
import { SiteNav } from "@/components/site-nav";
import { RevealableContent } from "@/components/revealable-content";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    content: r.isConfidential ? decrypt(r.content) : r.content,
    authorName: r.author.displayName,
    createdAt: r.createdAt,
  }));

  return (
    <>
      <SiteNav user={user} />
      <main className="mx-auto max-w-3xl px-4 py-8">
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
                    <CardTitle className="flex items-center justify-between text-base">
                      <Link
                        href={`/rooms/${it.roomId}`}
                        className="hover:underline"
                      >
                        {it.roomName}
                      </Link>
                      {it.isConfidential && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          confidential
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      From {it.authorName} ·{" "}
                      {it.createdAt.toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RevealableContent
                      content={it.content}
                      isConfidential={it.isConfidential}
                    />
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
