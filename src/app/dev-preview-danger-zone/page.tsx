"use client";

import { DeleteAccount } from "@/app/settings/delete-account";

export default function DevPreviewDangerZone() {
  return (
    <main className="w-full max-w-5xl p-6 sm:p-8 lg:mx-auto">
      <div className="mt-8 flex flex-col gap-6">
        <DeleteAccount />
      </div>
    </main>
  );
}
