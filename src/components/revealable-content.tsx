"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "@/components/i18n-provider";

interface Props {
  content: string;
  isConfidential: boolean;
}

export function RevealableContent({ content, isConfidential }: Props) {
  const t = useTranslations();
  const [revealed, setRevealed] = useState(false);

  if (!isConfidential) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
    );
  }

  // The content is always rendered so it occupies the same space in both
  // states — toggling reveal/hide never shifts the surrounding layout. When
  // hidden the text is made transparent and unselectable, and a fully opaque
  // striped overlay is painted on top so nothing shows through. (An earlier
  // blur-based approach left stale blur shadows on some devices because the
  // overflowed blur region wasn't repainted on reveal.)
  return (
    <button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      aria-label={
        revealed ? t.room.hideConfidential : t.room.revealConfidential
      }
      aria-pressed={revealed}
      className="group relative block w-full cursor-pointer overflow-hidden rounded-md text-left"
    >
      <p
        aria-hidden={!revealed}
        className={`whitespace-pre-wrap text-sm leading-relaxed ${
          revealed ? "" : "select-none text-transparent"
        }`}
      >
        {content}
      </p>

      {revealed ? (
        <span className="pointer-events-none absolute top-0 right-0 inline-flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs text-muted-foreground transition group-hover:text-foreground">
          <EyeOff className="size-3" /> {t.room.hide}
        </span>
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center bg-muted"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgb(99 102 241 / 0.12) 0, rgb(99 102 241 / 0.12) 6px, transparent 6px, transparent 12px), linear-gradient(135deg, rgb(139 92 246 / 0.10), rgb(56 189 248 / 0.08))",
          }}
        >
          <span className="inline-flex items-center gap-2 rounded-md border border-dashed border-amber-400/50 bg-amber-50 px-3 py-2 text-sm text-amber-900 transition group-hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200 dark:group-hover:bg-amber-950/60">
            <Eye className="size-4" />
            {t.room.tapToReveal}
          </span>
        </span>
      )}
    </button>
  );
}
