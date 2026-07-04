import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    prayerRequest: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));
// requireUserId (real) reads the session, so we only mock the session source.
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));

import { PATCH, DELETE } from "@/app/api/my/requests/[id]/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patchReq(body: unknown) {
  return new Request("http://localhost", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const find = vi.mocked(prisma.prayerRequest.findUnique);
const update = vi.mocked(prisma.prayerRequest.update);
const del = vi.mocked(prisma.prayerRequest.delete);
const session = vi.mocked(getSession);

function signedInAs(userId: string | undefined) {
  session.mockResolvedValue({ userId } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("my/requests/[id] PATCH — mark prayer answered", () => {
  it("rejects unauthenticated requests (401)", async () => {
    signedInAs(undefined);
    const res = await PATCH(patchReq({ answered: true }), ctx("r1"));
    expect(res.status).toBe(401);
    expect(find).not.toHaveBeenCalled();
  });

  it("returns 404 for a request that does not exist", async () => {
    signedInAs("u1");
    find.mockResolvedValue(null);
    const res = await PATCH(patchReq({ answered: true }), ctx("missing"));
    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 404 (not 403) for a request authored by another user", async () => {
    signedInAs("u1");
    find.mockResolvedValue({ id: "r1", authorId: "someone-else" } as never);
    const res = await PATCH(patchReq({ answered: true }), ctx("r1"));
    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a body without a boolean answered flag (400)", async () => {
    signedInAs("u1");
    find.mockResolvedValue({ id: "r1", authorId: "u1" } as never);
    const res = await PATCH(patchReq({ answered: "yes" }), ctx("r1"));
    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("sets answeredAt when answered is true (200)", async () => {
    signedInAs("u1");
    find.mockResolvedValue({ id: "r1", authorId: "u1" } as never);
    update.mockResolvedValue({ id: "r1", answeredAt: new Date() } as never);
    const res = await PATCH(patchReq({ answered: true }), ctx("r1"));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { answeredAt: expect.any(Date) },
      select: { id: true, answeredAt: true },
    });
  });

  it("clears answeredAt when answered is false (200)", async () => {
    signedInAs("u1");
    find.mockResolvedValue({ id: "r1", authorId: "u1" } as never);
    update.mockResolvedValue({ id: "r1", answeredAt: null } as never);
    const res = await PATCH(patchReq({ answered: false }), ctx("r1"));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { answeredAt: null },
      select: { id: true, answeredAt: true },
    });
  });
});

describe("my/requests/[id] DELETE — author deletes own request", () => {
  it("rejects unauthenticated requests (401)", async () => {
    signedInAs(undefined);
    const res = await DELETE(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(401);
    expect(find).not.toHaveBeenCalled();
  });

  it("returns 404 for a request that does not exist", async () => {
    signedInAs("u1");
    find.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost"), ctx("missing"));
    expect(res.status).toBe(404);
    expect(del).not.toHaveBeenCalled();
  });

  it("returns 404 (not 403) for a request authored by another user", async () => {
    signedInAs("u1");
    find.mockResolvedValue({ id: "r1", authorId: "someone-else" } as never);
    const res = await DELETE(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(404);
    expect(del).not.toHaveBeenCalled();
  });

  it("deletes the author's own request (200)", async () => {
    signedInAs("u1");
    find.mockResolvedValue({ id: "r1", authorId: "u1" } as never);
    del.mockResolvedValue({ id: "r1" } as never);
    const res = await DELETE(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(200);
    expect(del).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
