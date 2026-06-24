import type { Metadata } from "next";
import { EmailLoginForm } from "@/app/auth/email-login/email-login-form";
import { EmailLoginConfirm } from "@/app/auth/email-login/email-login-confirm";

export const metadata: Metadata = {
  title: "Sign in with email",
};

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
