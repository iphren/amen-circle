"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConsentCheckboxes } from "@/components/consent-checkboxes";
import { useTranslations } from "@/components/i18n-provider";

// Shown instead of the dashboard to accounts created before the consent flow
// existed. Blocks the app until the user records the consent that new
// registrations capture at sign-up.
export function ConsentGate() {
  const t = useTranslations();
  const router = useRouter();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [consentReligiousData, setConsentReligiousData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/my/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ acceptTerms, consentReligiousData }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.consent.couldNotSave);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.consent.couldNotSave);
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{t.consent.gateTitle}</CardTitle>
        <CardDescription>{t.consent.gateDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ConsentCheckboxes
          idPrefix="gate"
          acceptTerms={acceptTerms}
          onAcceptTermsChange={setAcceptTerms}
          consentReligiousData={consentReligiousData}
          onConsentReligiousDataChange={setConsentReligiousData}
        />
        <Button
          onClick={handleAccept}
          disabled={busy || !acceptTerms || !consentReligiousData}
        >
          {busy ? t.consent.saving : t.consent.agreeAndContinue}
        </Button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {t.consent.gateFootnote}
        </p>
      </CardContent>
    </Card>
  );
}
