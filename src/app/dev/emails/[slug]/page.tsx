import Link from "next/link";
import { notFound } from "next/navigation";
import { PREVIEW_EMAIL_TEMPLATES } from "@/lib/email";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/i18n/config";

export function generateStaticParams() {
  return Object.keys(PREVIEW_EMAIL_TEMPLATES).map((slug) => ({ slug }));
}

export default async function EmailPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { slug } = await params;
  const template = PREVIEW_EMAIL_TEMPLATES[slug];
  if (!template) notFound();

  const previews = SUPPORTED_LOCALES.map((locale) => ({
    locale,
    label: LOCALE_LABELS[locale],
    ...template.build(locale),
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/dev/emails"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← All templates
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {template.label}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All supported language versions rendered from the same sample data.
      </p>

      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Email languages">
        {previews.map(({ locale, label }) => (
          <a
            key={locale}
            href={`#${locale}`}
            className="rounded-md border px-3 py-1 text-xs hover:bg-muted"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-10">
        {previews.map(({ locale, label, subject, html, text }) => (
          <section key={locale} id={locale} className="scroll-mt-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Locale: <code className="font-mono">{locale}</code>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Subject: {subject}
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border">
              <iframe
                title={`${template.label} — ${label} HTML preview`}
                srcDoc={html}
                className="h-[600px] w-full"
                sandbox=""
              />
            </div>

            <h3 className="mt-6 text-sm font-semibold">Plain-text part</h3>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm">
              {text}
            </pre>
          </section>
        ))}
      </div>
    </main>
  );
}
