import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { PasskeyForm } from "@/app/auth/passkey-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { mode } = await searchParams;
  const initialMode = mode === "register" ? "register" : "login";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
      <PasskeyForm initialMode={initialMode} />
    </main>
  );
}
