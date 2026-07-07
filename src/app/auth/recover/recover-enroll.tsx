"use client";

import { useState } from "react";
import Link from "next/link";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/components/i18n-provider";

export function RecoverEnroll({ token }: { token: string }) {
  const t = useTranslations();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecover() {
    setBusy(true);
    setError(null);
    try {
      const verifyRes = await fetch("/api/auth/recover/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        throw new Error(j.error ?? t.recover.invalidLink);
      }
      const options = await verifyRes.json();
      const attResp = await startRegistration({ optionsJSON: options });
      const finishRes = await fetch("/api/auth/recover/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(attResp),
      });
      if (!finishRes.ok) {
        const j = await finishRes.json().catch(() => ({}));
        throw new Error(j.error ?? t.recover.couldNotSetup);
      }
      window.location.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.recover.recoveryFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t.recover.enrollTitle}</CardTitle>
        <CardDescription>{t.recover.enrollDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button onClick={handleRecover} disabled={busy} className="mt-2">
          {busy ? t.recover.settingUp : t.recover.createNewPasskey}
        </Button>
        {error && (
          <>
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
            <Link
              href="/auth/recover"
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
