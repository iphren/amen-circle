import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { decryptContent } from "@/lib/crypto";
import { SiteNav } from "@/components/site-nav";
import { PrayerRules } from "@/components/prayer-rules";
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
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/interpolate";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.myPrayersTitle };
}

export default async function MyPrayersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireCurrentUser();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const tab = (await searchParams).tab === "sent" ? "sent" : "received";

  const tabs = [
    { key: "received", label: t.myPrayers.tabReceived, href: "/my-prayers" },
    { key: "sent", label: t.myPrayers.tabSent, href: "/my-prayers?tab=sent" },
  ] as const;

  return (
    <>
      <SiteNav user={user} />
      <main className="max-w-5xl p-8 lg:mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.myPrayers.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tab === "received"
            ? t.myPrayers.receivedSubtitle
            : t.myPrayers.sentSubtitle}
        </p>

        <nav className="mt-6 flex gap-2" aria-label={t.myPrayers.tabsLabel}>
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={tab === item.key ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                tab === item.key
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {tab === "received" ? (
          <ReceivedList userId={user.id} locale={locale} />
        ) : (
          <SentList userId={user.id} locale={locale} />
        )}
      </main>
    </>
  );
}

async function ReceivedList({
  userId,
  locale,
}: {
  userId: string;
  locale: Locale;
}) {
  const t = getDictionary(locale);
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
      <>
        <p className="mt-8 text-sm text-muted-foreground">
          {t.myPrayers.receivedEmpty}
        </p>
        <PrayerRules
          title={t.landing.prayerRulesTitle}
          rules={t.landing.prayerRules}
          highlightedSteps={[4]}
          className="mt-8 max-w-2xl border-t pt-6"
        />
      </>
    );
  }

  return (
    <>
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
                        {t.myPrayers.prayerAnswered}
                      </span>
                    )}
                    {it.isConfidential && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {t.myPrayers.confidential}
                      </span>
                    )}
                  </span>
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-1.5">
                  {t.myPrayers.fromLabel} <UserChip name={it.authorName} /> ·{" "}
                  {formatDate(it.createdAt, locale)}
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
                    interpolate(t.myPrayers.reportSubject, { id: it.id }),
                  )}`}
                >
                  {t.myPrayers.report}
                </a>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <PrayerRules
        title={t.landing.prayerRulesTitle}
        rules={t.landing.prayerRules}
        highlightedSteps={[4]}
        className="mt-8 max-w-2xl"
      />
    </>
  );
}

async function SentList({
  userId,
  locale,
}: {
  userId: string;
  locale: Locale;
}) {
  const t = getDictionary(locale);
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
      <>
        <p className="mt-8 text-sm text-muted-foreground">
          {t.myPrayers.sentEmpty}
        </p>
        <PrayerRules
          title={t.landing.prayerRulesTitle}
          rules={t.landing.prayerRules}
          highlightedSteps={[5, 6, 7]}
          className="mt-8 max-w-2xl border-t pt-6"
        />
      </>
    );
  }

  return (
    <>
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
                      {t.myPrayers.confidential}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {formatDate(it.createdAt, locale)}
                </CardDescription>
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
      <PrayerRules
        title={t.landing.prayerRulesTitle}
        rules={t.landing.prayerRules}
        highlightedSteps={[5, 6, 7]}
        className="mt-8 max-w-2xl"
      />
    </>
  );
}
