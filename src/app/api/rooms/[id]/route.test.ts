import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    prayerRoom: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));

import { DELETE } from "@/app/api/rooms/[id]/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

const findRoom = vi.mocked(prisma.prayerRoom.findUnique);
const deleteRoom = vi.mocked(prisma.prayerRoom.delete);
const session = vi.mocked(getSession);

function signedInAs(userId: string | undefined) {
  session.mockResolvedValue({ userId } as never);
}

function room(overrides: Record<string, unknown> = {}) {
  return { id: "r1", ownerId: "owner", status: "OPEN", ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("rooms/[id] DELETE", () => {
  it("rejects unauthenticated requests (401)", async () => {
    signedInAs(undefined);
    const res = await DELETE(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(401);
    expect(findRoom).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing room", async () => {
    signedInAs("owner");
    findRoom.mockResolvedValue(null as never);
    const res = await DELETE(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(404);
    expect(deleteRoom).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is not the owner", async () => {
    signedInAs("someone-else");
    findRoom.mockResolvedValue(room() as never);
    const res = await DELETE(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(403);
    expect(deleteRoom).not.toHaveBeenCalled();
  });

  it("returns 400 when the room is closed", async () => {
    signedInAs("owner");
    findRoom.mockResolvedValue(room({ status: "CLOSED" }) as never);
    const res = await DELETE(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(400);
    expect(deleteRoom).not.toHaveBeenCalled();
  });

  it("deletes the room when the owner requests it (200)", async () => {
    signedInAs("owner");
    findRoom.mockResolvedValue(room() as never);
    deleteRoom.mockResolvedValue(room() as never);
    const res = await DELETE(new Request("http://localhost"), ctx("r1"));
    expect(res.status).toBe(200);
    expect(deleteRoom).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
