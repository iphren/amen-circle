import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function requireUserId(): Promise<
  { userId: string } | NextResponse
> {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return { userId: session.userId };
}
