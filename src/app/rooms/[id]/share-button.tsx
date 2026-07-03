"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareButton({ code }: { code: string }) {
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
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}
