import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    recoveryToken: { findMany: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("@/lib/email", () => ({ sendRecoveryEmail: vi.fn() }));

import { POST } from "@/app/api/auth/recover/start/route";
import { prisma } from "@/lib/prisma";
import { sendRecoveryEmail } from "@/lib/email";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/recover/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const findUnique = vi.mocked(prisma.user.findUnique);
const findManyTokens = vi.mocked(prisma.recoveryToken.findMany);
const sendEmail = vi.mocked(sendRecoveryEmail);

beforeEach(() => {
  vi.clearAllMocks();
  findManyTokens.mockResolvedValue([]);
});

describe("recover/start — enumeration safety", () => {
  it("sends a recovery email when the account exists (200)", async () => {
    findUnique.mockResolvedValue({
      id: "u1",
      email: "real@example.com",
    } as never);

    const res = await POST(jsonRequest({ email: "Real@Example.com" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendEmail).toHaveBeenCalledOnce();
    const arg = sendEmail.mock.calls[0][0];
    expect(arg.to).toBe("real@example.com");
    expect(arg.recoverUrl).toContain("/auth/recover?token=");
  });

  it("does NOT send mail for an unknown email but responds identically (200)", async () => {
    findUnique.mockResolvedValue(null);

    const res = await POST(jsonRequest({ email: "ghost@example.com" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns the same response shape for known vs unknown emails", async () => {
    findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "real@example.com",
    } as never);
    const known = await POST(jsonRequest({ email: "real@example.com" }));

    findUnique.mockResolvedValueOnce(null);
    const unknown = await POST(jsonRequest({ email: "ghost@example.com" }));

    expect(known.status).toBe(unknown.status);
    expect(await known.json()).toEqual(await unknown.json());
  });

  it("still returns 200 even if the email send throws (no leak via error)", async () => {
    findUnique.mockResolvedValue({
      id: "u1",
      email: "real@example.com",
    } as never);
    sendEmail.mockRejectedValue(new Error("SES down"));

    const res = await POST(jsonRequest({ email: "real@example.com" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("returns 200 without lookups when email is missing", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(200);
    expect(findUnique).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("recover/start — silent rate limit", () => {
  beforeEach(() => {
    findUnique.mockResolvedValue({
      id: "u1",
      email: "real@example.com",
    } as never);
  });

  it("skips the send during the 60s cooldown but still returns {ok:true}", async () => {
    findManyTokens.mockResolvedValue([
      { createdAt: new Date(Date.now() - 10 * 1000) },
    ] as never);

    const res = await POST(jsonRequest({ email: "real@example.com" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("skips the send after 3 tokens in the past hour but still returns {ok:true}", async () => {
    const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);
    findManyTokens.mockResolvedValue([
      { createdAt: minutesAgo(50) },
      { createdAt: minutesAgo(30) },
      { createdAt: minutesAgo(10) },
    ] as never);

    const res = await POST(jsonRequest({ email: "real@example.com" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends normally when past the cooldown and under the hourly cap", async () => {
    findManyTokens.mockResolvedValue([
      { createdAt: new Date(Date.now() - 5 * 60 * 1000) },
    ] as never);

    const res = await POST(jsonRequest({ email: "real@example.com" }));

    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledOnce();
  });
});
