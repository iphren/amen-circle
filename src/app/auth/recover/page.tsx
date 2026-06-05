import type { Metadata } from "next";
import { RecoverForm } from "@/app/auth/recover/recover-form";
import { RecoverEnroll } from "@/app/auth/recover/recover-enroll";

export const metadata: Metadata = {
  title: "Recover account",
};

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
