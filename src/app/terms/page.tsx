import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/interpolate";
import { TERMS_VERSION } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return {
    title: t.metadata.termsTitle,
    description: t.metadata.termsDescription,
  };
}

export default async function TermsPage() {
  const t = getDictionary(await getLocale());
  return (
    <LegalDoc
      back={t.legal.back}
      title={t.legal.terms.title}
      lastUpdated={interpolate(t.legal.lastUpdated, { version: TERMS_VERSION })}
      sections={t.legal.terms.sections}
    />
  );
}
