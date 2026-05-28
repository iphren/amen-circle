"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  content: string;
  isConfidential: boolean;
}

export function RevealableContent({ content, isConfidential }: Props) {
  const [revealed, setRevealed] = useState(false);

  if (!isConfidential) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
    );
  }

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-amber-400/50 bg-amber-50 px-3 py-2 text-sm text-amber-900 transition hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
        aria-label="Reveal confidential message"
      >
        <Eye className="size-4" />
        Tap to reveal confidential message
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      <button
        type="button"
        onClick={() => setRevealed(false)}
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        aria-label="Hide confidential message"
      >
        <EyeOff className="size-3" /> Hide
      </button>
    </div>
  );
}
