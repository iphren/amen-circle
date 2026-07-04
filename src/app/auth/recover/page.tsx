import type { Metadata } from "next";
import { RecoverForm } from "@/app/auth/recover/recover-form";
import { RecoverEnroll } from "@/app/auth/recover/recover-enroll";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.recoverTitle };
}

export default async function RecoverPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      {token ? <RecoverEnroll token={token} /> : <RecoverForm />}
    </main>
  );
}
