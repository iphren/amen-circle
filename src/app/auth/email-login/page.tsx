import type { Metadata } from "next";
import { EmailLoginForm } from "@/app/auth/email-login/email-login-form";
import { EmailLoginConfirm } from "@/app/auth/email-login/email-login-confirm";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.emailLoginTitle };
}

export default async function EmailLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      {token ? <EmailLoginConfirm token={token} /> : <EmailLoginForm />}
    </main>
  );
}
