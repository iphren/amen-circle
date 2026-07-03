import { nameColorClasses } from "@/lib/utils";

export function UserChip({ name }: { name: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded px-2 py-0.5 text-xs font-medium ${nameColorClasses(name)}`}
    >
      {name}
    </span>
  );
}
