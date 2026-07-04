import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getCurrentUser } from "@/lib/current-user";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  negotiateAcceptLanguage,
  resolveLocale,
  type Locale,
} from "@/lib/i18n/config";

// Resolves the active locale for the current request. Precedence:
//   1. the signed-in user's saved preference (syncs across devices)
//   2. the `locale` cookie (set by the proxy for first-time / logged-out visitors)
//   3. the Accept-Language header
//   4. the default (en-GB)
// Memoized per request so the layout and any nested server component share one
// resolution (and one user lookup, itself cached).
export const getLocale = cache(async (): Promise<Locale> => {
  const user = await getCurrentUser();
  if (user?.preferredLanguage) {
    return resolveLocale(user.preferredLanguage);
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isSupportedLocale(cookieLocale)) return cookieLocale;

  const headerStore = await headers();
  const accept = headerStore.get("accept-language");
  if (accept) return negotiateAcceptLanguage(accept);

  return DEFAULT_LOCALE;
});
