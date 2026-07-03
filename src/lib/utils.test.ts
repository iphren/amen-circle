import { describe, it, expect } from "vitest";
import { formatDate, nameColorClasses } from "@/lib/utils";

describe("formatDate", () => {
  it("formats a Date as '3 July 2026'", () => {
    expect(formatDate(new Date("2026-07-03T12:00:00Z"))).toBe("3 July 2026");
  });

  it("formats an ISO string the same way", () => {
    expect(formatDate("2026-07-03T12:00:00Z")).toBe("3 July 2026");
  });

  it("uses day-month-year order (no ambiguous M/D/Y)", () => {
    // 12 January, not December 1st
    expect(formatDate("2026-01-12T12:00:00Z")).toBe("12 January 2026");
  });
});

describe("nameColorClasses", () => {
  const PALETTE_SIZE = 6;

  it("is deterministic for the same name", () => {
    expect(nameColorClasses("Ada")).toBe(nameColorClasses("Ada"));
  });

  it("always returns a class string from the palette shape", () => {
    for (const name of ["Ada", "Grace", "Linus", "李雷", ""]) {
      const cls = nameColorClasses(name);
      expect(cls).toMatch(/^bg-\S+ text-\S+ dark:bg-\S+ dark:text-\S+$/);
    }
  });

  it("can produce different colors for different names", () => {
    const colors = new Set(
      Array.from({ length: PALETTE_SIZE * 3 }, (_, i) =>
        nameColorClasses(`name-${i}`),
      ),
    );
    expect(colors.size).toBeGreaterThan(1);
  });
});
