import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    passkey: { findUnique: vi.fn(), count: vi.fn(), delete: vi.fn() },
  },
}));
// requireUserId (real) reads the session, so we only mock the session source.
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));

import { DELETE } from "@/app/api/auth/passkeys/[id]/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

const find = vi.mocked(prisma.passkey.findUnique);
const count = vi.mocked(prisma.passkey.count);
const del = vi.mocked(prisma.passkey.delete);
const session = vi.mocked(getSession);

function signedInAs(userId: string | undefined) {
  session.mockResolvedValue({ userId } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("passkeys/[id] DELETE — authorization & last-passkey guard", () => {
  it("rejects unauthenticated requests (401)", async () => {
    signedInAs(undefined);
    const res = await DELETE(new Request("http://localhost"), ctx("pk1"));
    expect(res.status).toBe(401);
    expect(find).not.toHaveBeenCalled();
  });

  it("returns 404 for a passkey that does not exist", async () => {
    signedInAs("u1");
    find.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost"), ctx("missing"));
    expect(res.status).toBe(404);
    expect(del).not.toHaveBeenCalled();
  });

  it("returns 404 (not 403) for a passkey owned by another user", async () => {
    signedInAs("u1");
    find.mockResolvedValue({ id: "pk1", userId: "someone-else" } as never);
    const res = await DELETE(new Request("http://localhost"), ctx("pk1"));
    expect(res.status).toBe(404);
    expect(del).not.toHaveBeenCalled();
  });

  it("refuses to remove the user's only passkey (409)", async () => {
    signedInAs("u1");
    find.mockResolvedValue({ id: "pk1", userId: "u1" } as never);
    count.mockResolvedValue(1 as never);
    const res = await DELETE(new Request("http://localhost"), ctx("pk1"));
    expect(res.status).toBe(409);
    expect(del).not.toHaveBeenCalled();
  });

  it("removes a passkey when the user has more than one (200)", async () => {
    signedInAs("u1");
    find.mockResolvedValue({ id: "pk1", userId: "u1" } as never);
    count.mockResolvedValue(2 as never);
    del.mockResolvedValue({ id: "pk1" } as never);
    const res = await DELETE(new Request("http://localhost"), ctx("pk1"));
    expect(res.status).toBe(200);
    expect(del).toHaveBeenCalledWith({ where: { id: "pk1" } });
  });
});
