"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/i18n-provider";

export function ShareButton({ code }: { code: string }) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/join?code=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Nothing more we can do; stay silent rather than break the page.
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={copyLink}>
      {copied ? t.room.shareCopied : t.room.share}
    </Button>
  );
}
