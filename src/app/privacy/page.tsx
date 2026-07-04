import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/interpolate";
import { formatDate } from "@/lib/utils";
import { PRIVACY_VERSION } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return {
    title: t.metadata.privacyTitle,
    description: t.metadata.privacyDescription,
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return (
    <LegalDoc
      back={t.legal.back}
      title={t.legal.privacy.title}
      lastUpdated={interpolate(t.legal.lastUpdated, {
        version: formatDate(PRIVACY_VERSION, locale),
      })}
      sections={t.legal.privacy.sections}
    />
  );
}
