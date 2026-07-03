import Link from "next/link";
import { notFound } from "next/navigation";
import { PREVIEW_EMAIL_TEMPLATES } from "@/lib/email";

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

  const { subject, html, text } = template.build();

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
      <p className="mt-1 text-sm text-muted-foreground">Subject: {subject}</p>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <iframe
          title={`${template.label} — HTML preview`}
          srcDoc={html}
          className="h-[600px] w-full"
          sandbox=""
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold">Plain-text part</h2>
      <pre className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm">
        {text}
      </pre>
    </main>
  );
}
