import { notFound, redirect } from "next/navigation";

export default function DevMailsAliasPage() {
  if (process.env.NODE_ENV === "production") notFound();
  redirect("/dev/emails");
}
