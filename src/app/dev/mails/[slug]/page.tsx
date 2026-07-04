import { notFound, redirect } from "next/navigation";

export default async function DevMailAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { slug } = await params;
  redirect(`/dev/emails/${slug}`);
}
