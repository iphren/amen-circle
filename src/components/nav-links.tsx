"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/my-prayers", label: "My prayers" },
  { href: "/settings", label: "Settings" },
];

// In the mobile drawer the logo isn't a convenient way back to the dashboard,
// so surface it as an explicit link there.
const drawerLinks = [{ href: "/dashboard", label: "Dashboard" }, ...links];

export function NavLinks({
  orientation = "horizontal",
  onNavigate,
}: {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";
  const items = isVertical ? drawerLinks : links;

  return (
    <nav
      className={cn(
        "text-sm text-muted-foreground",
        isVertical ? "flex flex-col gap-1" : "flex items-center gap-4",
      )}
    >
      {items.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "hover:text-foreground",
              isVertical && "rounded-md px-3 py-2 text-base hover:bg-muted",
              isActive && "font-medium text-foreground",
              isVertical && isActive && "bg-muted",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
