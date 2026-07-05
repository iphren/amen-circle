"use client";

import { useCallback, useRef, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Styles the confirm button as destructive (for irreversible actions). */
  destructive?: boolean;
  /** Extra classes for the confirm button, to override its color per call. */
  confirmClassName?: string;
}

/**
 * Promise-based replacement for the native `window.confirm`. Renders its own
 * modal locally, so no global provider is required:
 *
 *   const { confirm, dialog } = useConfirm();
 *   // in JSX: {dialog}
 *   // in a handler: if (!(await confirm({ title: "…" }))) return;
 */
export function useConfirm() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  // Resolve the pending promise once and close. Guards against double-settle
  // (clicking confirm also triggers onOpenChange -> settle(false)).
  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  }, []);

  const dialog = (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) settle(false);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg outline-none transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <AlertDialog.Title className="text-base font-semibold">
            {opts?.title}
          </AlertDialog.Title>
          {opts?.description && (
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {opts.description}
            </AlertDialog.Description>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => settle(false)}>
              {opts?.cancelText ?? t.common.cancel}
            </Button>
            <Button
              variant={opts?.destructive ? "destructive" : "default"}
              size="sm"
              className={cn(opts?.confirmClassName)}
              onClick={() => settle(true)}
            >
              {opts?.confirmText ?? t.common.confirm}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );

  return { confirm, dialog };
}
