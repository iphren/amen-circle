import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  // Null for accounts created before the consent flow; the dashboard blocks
  // such users behind ConsentGate until they accept.
  religiousDataConsentAt: Date | null;
}

// Memoized per request so multiple resolvers in one render (e.g. a page and its
// generateMetadata) share a single session read + user lookup instead of each
// hitting the DB.
export const getCurrentUser = cache(
  async (): Promise<CurrentUser | null> => {
    const session = await getSession();
    if (!session.userId) return null;
    return prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        religiousDataConsentAt: true,
      },
    });
  },
);

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
}
