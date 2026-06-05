import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recoveryToken: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/passkey-enroll", () => ({ buildEnrollmentOptions: vi.fn() }));

import { POST } from "@/app/api/auth/recover/verify/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildEnrollmentOptions } from "@/lib/passkey-enroll";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/recover/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function fakeSession() {
  return { save: vi.fn().mockResolvedValue(undefined) } as Record<
    string,
    unknown
  > & { save: ReturnType<typeof vi.fn> };
}

const tokenFind = vi.mocked(prisma.recoveryToken.findUnique);
const tokenClaim = vi.mocked(prisma.recoveryToken.updateMany);
const enrollOpts = vi.mocked(buildEnrollmentOptions);
const session = vi.mocked(getSession);

beforeEach(() => {
  vi.clearAllMocks();
  enrollOpts.mockResolvedValue({
    options: { challenge: "chal" } as never,
    challenge: "chal",
  });
});

describe("recover/verify — token lifecycle", () => {
  it("rejects a missing token (400)", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
    expect(tokenFind).not.toHaveBeenCalled();
  });

  it("rejects an unknown token (400)", async () => {
    tokenFind.mockResolvedValue(null);
    const res = await POST(jsonRequest({ token: "does-not-exist" }));
    expect(res.status).toBe(400);
    expect(tokenClaim).not.toHaveBeenCalled();
  });

  it("rejects an already-used or expired token (claim matches 0 rows → 400)", async () => {
    tokenFind.mockResolvedValue({ id: "t1", userId: "u1" } as never);
    tokenClaim.mockResolvedValue({ count: 0 } as never);

    const res = await POST(jsonRequest({ token: "spent" }));

    expect(res.status).toBe(400);
    expect(enrollOpts).not.toHaveBeenCalled();
  });

  it("accepts a valid token: claims it, returns options, sets the recovery session (200)", async () => {
    tokenFind.mockResolvedValue({ id: "t1", userId: "u1" } as never);
    tokenClaim.mockResolvedValue({ count: 1 } as never);
    const s = fakeSession();
    session.mockResolvedValue(s as never);

    const res = await POST(jsonRequest({ token: "valid" }));

    expect(res.status).toBe(200);
    expect(enrollOpts).toHaveBeenCalledWith("u1");
    expect(s.pendingUserId).toBe("u1");
    expect(s.challenge).toBe("chal");
    expect(s.save).toHaveBeenCalledOnce();
  });

  it("is single-use: a replay of the same token is rejected (200 then 400)", async () => {
    tokenFind.mockResolvedValue({ id: "t1", userId: "u1" } as never);
    // First claim wins (count 1); the replay matches 0 rows.
    tokenClaim
      .mockResolvedValueOnce({ count: 1 } as never)
      .mockResolvedValueOnce({ count: 0 } as never);
    session.mockResolvedValue(fakeSession() as never);

    const first = await POST(jsonRequest({ token: "valid" }));
    const second = await POST(jsonRequest({ token: "valid" }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
  });
});
