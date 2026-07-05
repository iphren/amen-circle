import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
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
        <h1 className="text-4xl font-semibold tracking-tight">
          {t.common.appName}
        </h1>
        <p className="mt-3 text-muted-foreground">{t.common.tagline}</p>

        <div className="mt-10 flex flex-col gap-3">
          <Link href="/auth?mode=register" className={buttonVariants({ size: "lg" })}>
            {t.landing.register}
          </Link>
          <Link
            href="/auth?mode=login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            {t.landing.signIn}
          </Link>
        </div>

        <section className="mt-10 text-left">
          <h2 className="text-sm font-semibold tracking-tight">
            {t.landing.prayerRulesTitle}
          </h2>
          <ol className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {t.landing.prayerRules.map((rule, index) => (
              <li key={rule} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium text-foreground">
                  {index + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
