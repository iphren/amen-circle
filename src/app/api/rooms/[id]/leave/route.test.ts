import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    prayerRoom: { findUnique: vi.fn() },
    prayerRequest: { deleteMany: vi.fn() },
    membership: { delete: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));

import { POST } from "@/app/api/rooms/[id]/leave/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

const findRoom = vi.mocked(prisma.prayerRoom.findUnique);
const deleteRequests = vi.mocked(prisma.prayerRequest.deleteMany);
const deleteMembership = vi.mocked(prisma.membership.delete);
const transaction = vi.mocked(prisma.$transaction);
const session = vi.mocked(getSession);

function signedInAs(userId: string | undefined) {
  session.mockResolvedValue({ userId } as never);
}

function room(overrides: Record<string, unknown> = {}) {
  return {
    id: "r1",
    ownerId: "owner",
    status: "OPEN",
    memberships: [{ userId: "u1" }, { userId: "owner" }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("rooms/[id]/leave POST", () => {
  it("rejects unauthenticated requests (401)", async () => {
    signedInAs(undefined);
    const res = await POST(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(401);
    expect(findRoom).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing room", async () => {
    signedInAs("u1");
    findRoom.mockResolvedValue(null as never);
    const res = await POST(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(404);
  });

  it("returns 400 when the room is closed", async () => {
    signedInAs("u1");
    findRoom.mockResolvedValue(room({ status: "CLOSED" }) as never);
    const res = await POST(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(400);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is the owner (must cancel instead)", async () => {
    signedInAs("owner");
    findRoom.mockResolvedValue(room() as never);
    const res = await POST(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(403);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is not a member", async () => {
    signedInAs("stranger");
    findRoom.mockResolvedValue(room() as never);
    const res = await POST(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(403);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("deletes the caller's request and membership on success (200)", async () => {
    signedInAs("u1");
    findRoom.mockResolvedValue(room() as never);
    const res = await POST(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(200);
    expect(transaction).toHaveBeenCalledOnce();
    expect(deleteRequests).toHaveBeenCalledWith({
      where: { roomId: "r1", authorId: "u1" },
    });
    expect(deleteMembership).toHaveBeenCalledWith({
      where: { userId_roomId: { userId: "u1", roomId: "r1" } },
    });
  });
});
