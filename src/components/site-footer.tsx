import Link from "next/link";
import { OPERATOR } from "@/lib/legal";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { FooterLanguageSelect } from "@/components/footer-language-select";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return (
    <footer className="border-t pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <p>
          © {new Date().getFullYear()} {OPERATOR.tradingName}
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:underline">
            {t.footer.privacy}
          </Link>
          <Link href="/terms" className="hover:underline">
            {t.footer.terms}
          </Link>
          <a
            href={`mailto:${OPERATOR.contactEmail}`}
            className="hover:underline"
          >
            {t.footer.contact}
          </a>
          <FooterLanguageSelect current={locale} />
        </nav>
      </div>
    </footer>
  );
}
