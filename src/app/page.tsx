import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Amen Circle</h1>
        <p className="mt-3 text-muted-foreground">
          Small circles of trusted friends, lifting each other up in prayer.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link href="/auth?mode=register" className={buttonVariants({ size: "lg" })}>
            Register
          </Link>
          <Link
            href="/auth?mode=login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
