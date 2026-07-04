"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/i18n-provider";

export function MobileMenu({ displayName }: { displayName: string }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={t.nav.openMenu}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }))}
      >
        <Menu />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-col gap-6 border-l bg-background shadow-xl outline-none",
            // Clear the notch / home indicator on phones.
            "p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]",
            "transition-transform duration-200 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="min-w-0 truncate text-sm font-medium">
              {displayName}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t.nav.closeMenu}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "shrink-0",
              )}
            >
              <X />
            </Dialog.Close>
          </div>

          <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />

          <div className="mt-auto">
            <LogoutButton />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
