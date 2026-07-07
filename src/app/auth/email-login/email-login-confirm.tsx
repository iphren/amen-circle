"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/components/i18n-provider";

export function EmailLoginConfirm({ token }: { token: string }) {
  const t = useTranslations();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login/email/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.emailLogin.invalidLink);
      }
      window.location.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.auth.errors.signInFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t.emailLogin.confirmTitle}</CardTitle>
        <CardDescription>{t.emailLogin.confirmDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button onClick={handleSignIn} disabled={busy} className="mt-2">
          {busy ? t.emailLogin.signingIn : t.emailLogin.signIn}
        </Button>
        {error && (
          <>
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
            <Link
              href="/auth/email-login"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {t.common.requestNewLink}
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
