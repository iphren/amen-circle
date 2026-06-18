import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { SiteNav } from "@/components/site-nav";

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

export default async function DashboardPage() {
  const user = await requireCurrentUser();

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
      <main className="mx-auto max-w-4xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="flex flex-col gap-8">
          <DashboardActions />

          <section>
            <h2 className="text-lg font-semibold tracking-tight">Your rooms</h2>
            {memberships.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                You haven&apos;t joined any rooms yet. Create one or join with
                a code above.
              </p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {memberships.map((m) => (
                  <li key={m.room.id}>
                    <Link href={`/rooms/${m.room.id}`} className="block">
                      <Card className="transition hover:border-foreground/30">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between gap-2 text-base">
                            <span className="min-w-0 truncate">{m.room.name}</span>
                            <span
                              className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                                m.room.status === "OPEN"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}
                            >
                              {m.room.status.toLowerCase()}
                            </span>
                          </CardTitle>
                          <CardDescription>
                            Code <code className="font-mono">{m.room.code}</code>{" "}
                            · {m.room._count.memberships} member
                            {m.room._count.memberships === 1 ? "" : "s"}
                            {m.room.ownerId === user.id && " · you own this"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                          Created {m.room.createdAt.toLocaleDateString()}
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
