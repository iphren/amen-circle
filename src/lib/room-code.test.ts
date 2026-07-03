import { describe, it, expect } from "vitest";
import { generateRoomCode, isRoomCode } from "@/lib/room-code";

describe("isRoomCode", () => {
  it("accepts a valid 6-char code from the alphabet", () => {
    expect(isRoomCode("ABC234")).toBe(true);
  });

  it("accepts lowercase (uppercased internally)", () => {
    expect(isRoomCode("abc234")).toBe(true);
  });

  it("accepts surrounding whitespace", () => {
    expect(isRoomCode("  ABC234  ")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(isRoomCode("ABC23")).toBe(false);
    expect(isRoomCode("ABC2345")).toBe(false);
  });

  it("rejects ambiguous chars excluded from the alphabet (I, O, 0, 1)", () => {
    for (const bad of ["ABC2O0", "ABC2I1", "ABCDI2", "ABCD10"]) {
      expect(isRoomCode(bad)).toBe(false);
    }
  });

  it("rejects names with spaces or punctuation", () => {
    expect(isRoomCode("Wednesday small group")).toBe(false);
    expect(isRoomCode("ABC-23")).toBe(false);
  });

  it("accepts what generateRoomCode produces", () => {
    for (let i = 0; i < 20; i++) {
      expect(isRoomCode(generateRoomCode())).toBe(true);
    }
  });
});
