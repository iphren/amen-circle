import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/current-user";
import { isRoomCode } from "@/lib/room-code";
import { JoinCard } from "@/app/join/join-card";

export const metadata: Metadata = {
  title: "Join a room",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await getCurrentUser();
  const { code: raw } = await searchParams;
  const code = (raw ?? "").trim().toUpperCase();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
      {isRoomCode(code) ? (
        <JoinCard code={code} signedIn={!!user} />
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
            <CardDescription>
              This join link is missing or has an invalid room code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={user ? "/dashboard" : "/"}
              className={buttonVariants({ variant: "outline" })}
            >
              {user ? "Back to dashboard" : "Go home"}
            </Link>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
