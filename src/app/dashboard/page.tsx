import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { SiteNav } from "@/components/site-nav";
import { ConsentGate } from "@/components/consent-gate";

export const metadata: Metadata = {
  title: "Rooms",
};
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

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  // Accounts predating the consent flow must accept before using the app.
  if (user.religiousDataConsentAt === null) {
    return (
      <>
        <SiteNav user={user} />
        <main className="max-w-5xl p-6 sm:p-8 lg:mx-auto">
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
      <main className="max-w-5xl p-6 sm:p-8 lg:mx-auto">
        <div className="flex flex-col gap-8">
          {/* Constrain the action bar so it doesn't stretch; the rooms grid
              below is free to fill the full page width. */}
          <div className="max-w-2xl">
            <DashboardActions />
          </div>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">Your rooms</h2>
            {memberships.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                You haven&apos;t joined any rooms yet. Create one or join with
                a code above.
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
                            Code <code className="font-mono">{m.room.code}</code>{" "}
                            · {m.room._count.memberships} member
                            {m.room._count.memberships === 1 ? "" : "s"}
                            {m.room.ownerId === user.id && " · you own this"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                          Created {formatDate(m.room.createdAt)}
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
