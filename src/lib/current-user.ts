import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, displayName: true },
  });
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
}
