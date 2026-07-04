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
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.joinTitle };
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await getCurrentUser();
  const t = getDictionary(await getLocale());
  const { code: raw } = await searchParams;
  const code = (raw ?? "").trim().toUpperCase();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
      {isRoomCode(code) ? (
        <JoinCard code={code} signedIn={!!user} />
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t.join.invalidTitle}</CardTitle>
            <CardDescription>{t.join.invalidDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={user ? "/dashboard" : "/"}
              className={buttonVariants({ variant: "outline" })}
            >
              {user ? t.common.backToDashboard : t.common.goHome}
            </Link>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
