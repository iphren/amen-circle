import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { SiteNav } from "@/components/site-nav";
import { PasskeyManager } from "@/app/settings/passkey-manager";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  const passkeys = await prisma.passkey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      deviceType: true,
      backedUp: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <SiteNav user={user} />
      <main className="max-w-5xl p-6 sm:p-8 lg:mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the passkeys that can sign in to your account.
        </p>
        <div className="mt-8">
          <PasskeyManager
            initialPasskeys={passkeys.map((p) => ({
              id: p.id,
              deviceType: p.deviceType,
              backedUp: p.backedUp,
              name: p.name,
              createdAt: p.createdAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </>
  );
}
