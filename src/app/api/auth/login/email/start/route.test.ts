import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    loginToken: { updateMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("@/lib/email", () => ({ sendLoginLinkEmail: vi.fn() }));

import { POST } from "@/app/api/auth/login/email/start/route";
import { prisma } from "@/lib/prisma";
import { sendLoginLinkEmail } from "@/lib/email";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login/email/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const findUnique = vi.mocked(prisma.user.findUnique);
const sendEmail = vi.mocked(sendLoginLinkEmail);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("login/email/start — enumeration safety", () => {
  it("sends a sign-in email when the account exists (200)", async () => {
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
    expect(arg.loginUrl).toContain("/auth/email-login?token=");
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
