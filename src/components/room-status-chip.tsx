import type { RoomStatus } from "@prisma/client";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function RoomStatusChip({ status }: { status: RoomStatus }) {
  const t = getDictionary(await getLocale());
  return (
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
        status === "OPEN"
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {status === "OPEN" ? t.roomStatus.open : t.roomStatus.closed}
    </span>
  );
}
