"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareButton({ code, name }: { code: string; name: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/join?code=${code}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: name,
          text: `Join "${name}" on Amen Circle`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // User cancelling the share sheet is not an error worth surfacing.
      if (e instanceof Error && e.name === "AbortError") return;
      // Fall back to copying if the share sheet itself failed.
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Nothing more we can do; stay silent rather than break the page.
      }
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={share}>
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
