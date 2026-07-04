import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { SiteNav } from "@/components/site-nav";
import { PasskeyManager } from "@/app/settings/passkey-manager";
import { DeleteAccount } from "@/app/settings/delete-account";
import { LanguageCard } from "@/app/settings/language-card";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveLocale } from "@/lib/i18n/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.settingsTitle };
}

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const locale = await getLocale();
  const t = getDictionary(locale);
  // Show the saved preference if there is one, otherwise the detected locale.
  const currentLanguage = user.preferredLanguage
    ? resolveLocale(user.preferredLanguage)
    : locale;

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
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.settings.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.settings.subtitle}
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

          <LanguageCard current={currentLanguage} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.settings.dataTitle}</CardTitle>
              <CardDescription>{t.settings.dataDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Plain link: same-origin cookie auth, works without JS. */}
              <a href="/api/my/export" className="text-sm underline">
                {t.settings.downloadData}
              </a>
            </CardContent>
          </Card>

          <DeleteAccount />
        </div>
      </main>
    </>
  );
}
