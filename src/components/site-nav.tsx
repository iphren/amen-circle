import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";
import type { CurrentUser } from "@/lib/current-user";

export function SiteNav({ user }: { user: CurrentUser }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Amen Circle
          </Link>
          <NavLinks />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{user.displayName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
