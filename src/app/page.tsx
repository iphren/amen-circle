import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PrayerRules } from "@/components/prayer-rules";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const t = getDictionary(await getLocale());

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="blur-fade-up text-4xl font-semibold tracking-tight">
          {t.common.appName}
        </h1>
        <p className="blur-fade-up mt-3 text-muted-foreground [--enter-delay:150ms]">
          {t.common.tagline}
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/auth?mode=register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "blur-fade-up [--enter-delay:300ms]",
            )}
          >
            {t.landing.register}
          </Link>
          <Link
            href="/auth?mode=login"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "blur-fade-up [--enter-delay:450ms]",
            )}
          >
            {t.landing.signIn}
          </Link>
        </div>

        <PrayerRules
          title={t.landing.prayerRulesTitle}
          rules={t.landing.prayerRules}
          className="blur-fade-up mt-10 [--enter-delay:600ms]"
        />
      </div>
    </main>
  );
}
