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

  // The content is always rendered so it occupies the same space in both
  // states — toggling reveal/hide never shifts the surrounding layout. When
  // hidden it's blurred and unselectable; the whole block is the toggle.
  return (
    <button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      aria-label={
        revealed ? "Hide confidential message" : "Reveal confidential message"
      }
      aria-pressed={revealed}
      className="group relative block w-full cursor-pointer text-left"
    >
      <p
        aria-hidden={!revealed}
        className={`whitespace-pre-wrap text-sm leading-relaxed transition ${
          revealed ? "" : "select-none blur-sm"
        }`}
      >
        {content}
      </p>

      {revealed ? (
        <span className="pointer-events-none absolute top-0 right-0 inline-flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs text-muted-foreground backdrop-blur-sm transition group-hover:text-foreground">
          <EyeOff className="size-3" /> Hide
        </span>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-md border border-dashed border-amber-400/50 bg-amber-50 px-3 py-2 text-sm text-amber-900 transition group-hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200 dark:group-hover:bg-amber-950/60">
            <Eye className="size-4" />
            Tap to reveal confidential message
          </span>
        </span>
      )}
    </button>
  );
}
