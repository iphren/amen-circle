import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveRequestLocale } from "@/lib/i18n/get-locale";

export async function requireUserId(): Promise<
  { userId: string } | NextResponse
> {
  const session = await getSession();
  if (!session.userId) {
    const t = getDictionary(await resolveRequestLocale());
    return NextResponse.json({ error: t.errors.unauthorized }, { status: 401 });
  }
  return { userId: session.userId };
}
