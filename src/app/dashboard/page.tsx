import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { SiteNav } from "@/components/site-nav";
import { ConsentGate } from "@/components/consent-gate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardActions } from "@/app/dashboard/dashboard-actions";
import { RoomStatusChip } from "@/components/room-status-chip";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/interpolate";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.roomsTitle };
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const locale = await getLocale();
  const t = getDictionary(locale);

  // Accounts predating the consent flow must accept before using the app.
  if (user.religiousDataConsentAt === null) {
    return (
      <>
        <SiteNav user={user} />
        <main className="max-w-5xl p-8 lg:mx-auto">
          <ConsentGate />
        </main>
      </>
    );
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: {
      room: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          ownerId: true,
          createdAt: true,
          _count: { select: { memberships: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <>
      <SiteNav user={user} />
      <main className="max-w-5xl p-8 lg:mx-auto">
        <div className="flex flex-col gap-8">
          {/* Constrain the action bar so it doesn't stretch; the rooms grid
              below is free to fill the full page width. */}
          <div className="max-w-2xl">
            <DashboardActions />
          </div>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">
              {t.dashboard.yourRooms}
            </h2>
            {memberships.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t.dashboard.noRooms}
              </p>
            ) : (
              <ul className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
                {memberships.map((m) => (
                  <li key={m.room.id}>
                    <Link href={`/rooms/${m.room.id}`} className="block">
                      <Card className="transition hover:border-foreground/30">
                        <CardHeader>
                          <CardTitle className="flex min-w-0 items-center justify-between gap-2 text-base">
                            <span className="min-w-0 truncate">{m.room.name}</span>
                            <RoomStatusChip status={m.room.status} />
                          </CardTitle>
                          <CardDescription>
                            {interpolate(t.dashboard.roomMeta, {
                              code: m.room.code,
                              count: m.room._count.memberships,
                              plural:
                                m.room._count.memberships === 1 ? "" : "s",
                            })}
                            {m.room.ownerId === user.id &&
                              t.dashboard.youOwnThis}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                          {interpolate(t.dashboard.created, {
                            date: formatDate(m.room.createdAt, locale),
                          })}
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
