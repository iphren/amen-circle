import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { safeInternalPath } from "@/lib/utils";
import { PasskeyForm } from "@/app/auth/passkey-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.signInTitle };
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>;
}) {
  const { mode, next } = await searchParams;
  const dest = safeInternalPath(next);

  const user = await getCurrentUser();
  if (user) redirect(dest);

  const initialMode = mode === "register" ? "register" : "login";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
      <PasskeyForm initialMode={initialMode} next={dest} />
    </main>
  );
}
