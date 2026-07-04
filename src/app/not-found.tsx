import Link from "next/link";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

// Rendered for unmatched URLs and any in-app notFound() call. It sits inside the
// async root layout, so <html lang>, the I18nProvider, and the footer are
// already in place.
export default async function NotFound() {
  const t = getDictionary(await getLocale());
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.notFound.title}
      </h1>
      <p className="mt-2 text-muted-foreground">{t.notFound.description}</p>
      <Link href="/" className="mt-6 text-sm text-muted-foreground hover:underline">
        {t.notFound.backHome}
      </Link>
    </main>
  );
}
