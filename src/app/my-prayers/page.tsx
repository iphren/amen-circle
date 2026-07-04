import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { decryptContent } from "@/lib/crypto";
import { SiteNav } from "@/components/site-nav";
import { RevealableContent } from "@/components/revealable-content";
import { UserChip } from "@/components/user-chip";
import { formatDate, cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OPERATOR } from "@/lib/legal";
import { SentRequestActions } from "./sent-request-actions";

export const metadata: Metadata = {
  title: "My prayers",
};

const tabs = [
  { key: "received", label: "Received", href: "/my-prayers" },
  { key: "sent", label: "Sent", href: "/my-prayers?tab=sent" },
] as const;

export default async function MyPrayersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireCurrentUser();
  const tab = (await searchParams).tab === "sent" ? "sent" : "received";

  return (
    <>
      <SiteNav user={user} />
      <main className="max-w-5xl p-8 lg:mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">My prayers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tab === "received"
            ? "Requests entrusted to you across all your rooms."
            : "Requests you have shared with your rooms."}
        </p>

        <nav className="mt-6 flex gap-2" aria-label="My prayers tabs">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {tab === "received" ? <ReceivedList userId={user.id} /> : <SentList userId={user.id} />}
      </main>
    </>
  );
}

async function ReceivedList({ userId }: { userId: string }) {
  const rows = await prisma.prayerRequest.findMany({
    where: { assignedToId: userId },
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
    answeredAt: r.answeredAt,
  }));

  if (items.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Nothing here yet. Once a room you&apos;re in is closed, requests
        assigned to you will show up here.
      </p>
    );
  }

  return (
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
                <span className="flex shrink-0 items-center gap-1.5">
                  {it.answeredAt && (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Prayer answered
                    </span>
                  )}
                  {it.isConfidential && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      confidential
                    </span>
                  )}
                </span>
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
  );
}

async function SentList({ userId }: { userId: string }) {
  // Explicit select: never expose assignedTo/assignedToId here. The author
  // must not be able to learn who is praying for them.
  const rows = await prisma.prayerRequest.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      isConfidential: true,
      content: true,
      createdAt: true,
      answeredAt: true,
      room: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const items = rows.map((r) => ({
    id: r.id,
    roomId: r.room.id,
    roomName: r.room.name,
    isConfidential: r.isConfidential,
    content: decryptContent(r.content, r.isConfidential),
    createdAt: r.createdAt,
    answered: r.answeredAt !== null,
  }));

  if (items.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Nothing here yet. Share a request in one of your rooms and it will
        show up here.
      </p>
    );
  }

  return (
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
              <CardDescription>{formatDate(it.createdAt)}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {it.content}
              </p>
              <SentRequestActions id={it.id} answered={it.answered} />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
