import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { SiteNav } from "@/components/site-nav";
import { PasskeyManager } from "@/app/settings/passkey-manager";
import { DeleteAccount } from "@/app/settings/delete-account";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <SiteNav user={user} />
      <main className="max-w-5xl p-8 lg:mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your passkeys, your data, and your account.
        </p>
        <div className="mt-8 flex flex-col gap-6">
          <PasskeyManager
            initialPasskeys={passkeys.map((p) => ({
              id: p.id,
              deviceType: p.deviceType,
              name: p.name,
              createdAt: p.createdAt.toISOString(),
            }))}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your data</CardTitle>
              <CardDescription>
                Download a copy of everything we hold about you, profile,
                consent records, circles, and your prayer requests, as JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Plain link: same-origin cookie auth, works without JS. */}
              <a href="/api/my/export" className="text-sm underline">
                Download my data
              </a>
            </CardContent>
          </Card>

          <DeleteAccount />
        </div>
      </main>
    </>
  );
}
