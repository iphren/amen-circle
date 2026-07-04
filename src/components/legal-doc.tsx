import Link from "next/link";
import { Inline } from "@/components/inline-md";
import { interpolate } from "@/lib/i18n/interpolate";
import { DOMAIN, OPERATOR } from "@/lib/legal";
import type { LegalSection } from "@/lib/i18n/types";

// Operator identity values interpolated into the legal prose ({legalName} etc.).
const LEGAL_VARS: Record<string, string> = {
  domain: DOMAIN,
  legalName: OPERATOR.legalName,
  tradingName: OPERATOR.tradingName,
  registrationNumber: OPERATOR.registrationNumber,
  registeredAddress: OPERATOR.registeredAddress,
  contactEmail: OPERATOR.contactEmail,
};

// Shared shell + renderer for the /privacy and /terms pages. Content (headings,
// paragraphs, lists) comes from the dictionary so it is fully localizable; the
// markdown-lite in each string is rendered by <Inline>.
export function LegalDoc({
  back,
  title,
  lastUpdated,
  sections,
}: {
  back: string;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        {back}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{lastUpdated}</p>

      {sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">
            {section.title}
          </h2>
          <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {section.blocks.map((block, i) =>
              block.type === "ul" ? (
                <ul key={i} className="list-disc space-y-2 pl-5">
                  {(block.items ?? []).map((item, j) => (
                    <li key={j}>
                      <Inline text={interpolate(item, LEGAL_VARS)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={i}>
                  <Inline text={interpolate(block.md ?? "", LEGAL_VARS)} />
                </p>
              ),
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
