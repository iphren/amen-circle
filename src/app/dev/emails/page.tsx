import Link from "next/link";
import { notFound } from "next/navigation";
import { PREVIEW_EMAIL_TEMPLATES } from "@/lib/email";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/i18n/config";

export default function EmailPreviewIndexPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const languages = SUPPORTED_LOCALES.map((locale) => LOCALE_LABELS[locale]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Email templates
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Local previews rendered from sample data — dev only. Each template shows{" "}
        {languages.join(" / ")}.
      </p>
      <ul className="mt-6 divide-y divide-border rounded-lg border">
        {Object.entries(PREVIEW_EMAIL_TEMPLATES).map(([slug, template]) => (
          <li key={slug}>
            <Link
              href={`/dev/emails/${slug}`}
              className="block px-4 py-3 text-sm hover:bg-muted"
            >
              <span className="font-medium">{template.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {languages.join(" / ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
