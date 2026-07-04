import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";
import { MobileMenu } from "@/components/mobile-menu";
import type { CurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function SiteNav({ user }: { user: CurrentUser }) {
  const t = getDictionary(await getLocale());
  return (
    <header className="border-b pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            {t.common.appName}
          </Link>
          <div className="hidden md:block">
            <NavLinks />
          </div>
        </div>

        {/* Desktop: name + sign out inline */}
        <div className="hidden items-center gap-3 text-sm md:flex">
          <span className="max-w-[12rem] truncate text-muted-foreground">
            {user.displayName}
          </span>
          <LogoutButton />
        </div>

        {/* Mobile: collapse everything into a drawer */}
        <div className="md:hidden">
          <MobileMenu displayName={user.displayName} />
        </div>
      </div>
    </header>
  );
}
