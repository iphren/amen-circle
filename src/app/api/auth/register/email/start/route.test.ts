import { describe, it, expect, beforeEach, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    loginToken: { findMany: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("@/lib/email", () => ({
  sendLoginLinkEmail: vi.fn(),
  sendRegistrationLinkEmail: vi.fn(),
}));
// Not used by the route, but resolveRequestLocale transitively imports the
// session module, which demands SESSION_SECRET at load time.
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));

import { POST } from "@/app/api/auth/register/email/start/route";
import { prisma } from "@/lib/prisma";
import { sendLoginLinkEmail, sendRegistrationLinkEmail } from "@/lib/email";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register/email/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Valid consent flags, spread into request bodies that should pass the gate.
const consented = { acceptTerms: true, consentReligiousData: true };

const findUnique = vi.mocked(prisma.user.findUnique);
const create = vi.mocked(prisma.user.create);
const update = vi.mocked(prisma.user.update);
const findManyTokens = vi.mocked(prisma.loginToken.findMany);
const sendLoginEmail = vi.mocked(sendLoginLinkEmail);
const sendRegistrationEmail = vi.mocked(sendRegistrationLinkEmail);

beforeEach(() => {
  vi.clearAllMocks();
  findManyTokens.mockResolvedValue([]);
});

describe("register/email/start — input validation", () => {
  it("returns 400 when email or displayName is missing, before any lookup", async () => {
    const res = await POST(
      jsonRequest({ email: "only@example.com", ...consented }),
    );
    expect(res.status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 when terms or religious-data consent is missing", async () => {
    const noConsent = await POST(
      jsonRequest({ email: "a@example.com", displayName: "A" }),
    );
    expect(noConsent.status).toBe(400);

    const termsOnly = await POST(
      jsonRequest({
        email: "a@example.com",
        displayName: "A",
        acceptTerms: true,
      }),
    );
    expect(termsOnly.status).toBe(400);

    expect(findUnique).not.toHaveBeenCalled();
    expect(sendRegistrationEmail).not.toHaveBeenCalled();
  });
});

describe("register/email/start — signup outcomes", () => {
  it("creates a brand-new user with consent recorded and sends a registration link (200)", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({
      id: "newuser",
      email: "new@example.com",
      displayName: "Newbie",
      passkeys: [],
      emailVerifiedAt: null,
    } as never);

    const res = await POST(
      jsonRequest({
        email: "New@Example.com",
        displayName: " Newbie ",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    // Email is normalised to lowercase, displayName trimmed, and all three
    // consent timestamps recorded.
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "new@example.com",
          displayName: "Newbie",
          termsAcceptedAt: expect.any(Date),
          religiousDataConsentAt: expect.any(Date),
          ageConfirmedAt: expect.any(Date),
        }),
      }),
    );
    expect(sendRegistrationEmail).toHaveBeenCalledOnce();
    const arg = sendRegistrationEmail.mock.calls[0][0];
    expect(arg.to).toBe("new@example.com");
    expect(arg.activateUrl).toContain("/auth/email-login?token=");
    expect(sendLoginEmail).not.toHaveBeenCalled();
  });

  it("resumes an interrupted signup: refreshes displayName + consent, sends a registration link (200)", async () => {
    findUnique.mockResolvedValue({
      id: "halfsignup",
      email: "half@example.com",
      passkeys: [],
      emailVerifiedAt: null,
    } as never);
    update.mockResolvedValue({
      id: "halfsignup",
      email: "half@example.com",
      passkeys: [],
      emailVerifiedAt: null,
    } as never);

    const res = await POST(
      jsonRequest({
        email: "half@example.com",
        displayName: "Half",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "halfsignup" },
        data: expect.objectContaining({
          displayName: "Half",
          termsAcceptedAt: expect.any(Date),
          religiousDataConsentAt: expect.any(Date),
          ageConfirmedAt: expect.any(Date),
        }),
      }),
    );
    expect(sendRegistrationEmail).toHaveBeenCalledOnce();
  });

  it("quietly sends a sign-in link for an account with a passkey, never touching its data (200)", async () => {
    findUnique.mockResolvedValue({
      id: "existing",
      email: "real@example.com",
      preferredLanguage: null,
      passkeys: [{ id: "pk1" }],
      emailVerifiedAt: null,
    } as never);

    const res = await POST(
      jsonRequest({
        email: "real@example.com",
        displayName: "Mallory",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(update).not.toHaveBeenCalled();
    expect(sendRegistrationEmail).not.toHaveBeenCalled();
    expect(sendLoginEmail).toHaveBeenCalledOnce();
    expect(sendLoginEmail.mock.calls[0][0].to).toBe("real@example.com");
  });

  it("treats a verified zero-passkey account as complete: sign-in link, no data overwrite (200)", async () => {
    findUnique.mockResolvedValue({
      id: "emailuser",
      email: "emailuser@example.com",
      preferredLanguage: null,
      passkeys: [],
      emailVerifiedAt: new Date(),
    } as never);

    const res = await POST(
      jsonRequest({
        email: "emailuser@example.com",
        displayName: "Mallory",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
    expect(sendRegistrationEmail).not.toHaveBeenCalled();
    expect(sendLoginEmail).toHaveBeenCalledOnce();
  });

  it("responds identically for new signups and existing complete accounts (no enumeration)", async () => {
    findUnique.mockResolvedValueOnce(null);
    create.mockResolvedValue({
      id: "newuser",
      email: "new@example.com",
      passkeys: [],
      emailVerifiedAt: null,
    } as never);
    const fresh = await POST(
      jsonRequest({
        email: "new@example.com",
        displayName: "Newbie",
        ...consented,
      }),
    );

    findUnique.mockResolvedValueOnce({
      id: "existing",
      email: "real@example.com",
      preferredLanguage: null,
      passkeys: [{ id: "pk1" }],
      emailVerifiedAt: null,
    } as never);
    const taken = await POST(
      jsonRequest({
        email: "real@example.com",
        displayName: "Mallory",
        ...consented,
      }),
    );

    expect(fresh.status).toBe(taken.status);
    expect(await fresh.json()).toEqual(await taken.json());
  });
});

describe("register/email/start — silent rate limit", () => {
  beforeEach(() => {
    findUnique.mockResolvedValue({
      id: "halfsignup",
      email: "half@example.com",
      passkeys: [],
      emailVerifiedAt: null,
    } as never);
    update.mockResolvedValue({
      id: "halfsignup",
      email: "half@example.com",
      passkeys: [],
      emailVerifiedAt: null,
    } as never);
  });

  it("skips the send during the 60s cooldown but still returns {ok:true}", async () => {
    findManyTokens.mockResolvedValue([
      { createdAt: new Date(Date.now() - 10 * 1000) },
    ] as never);

    const res = await POST(
      jsonRequest({
        email: "half@example.com",
        displayName: "Half",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendRegistrationEmail).not.toHaveBeenCalled();
    expect(sendLoginEmail).not.toHaveBeenCalled();
  });

  it("skips the send after 3 tokens in the past hour but still returns {ok:true}", async () => {
    const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);
    findManyTokens.mockResolvedValue([
      { createdAt: minutesAgo(50) },
      { createdAt: minutesAgo(30) },
      { createdAt: minutesAgo(10) },
    ] as never);

    const res = await POST(
      jsonRequest({
        email: "half@example.com",
        displayName: "Half",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(sendRegistrationEmail).not.toHaveBeenCalled();
  });
});

describe("register/email/start — failure modes", () => {
  it("still returns 200 if the email send throws (no leak via error)", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({
      id: "newuser",
      email: "new@example.com",
      passkeys: [],
      emailVerifiedAt: null,
    } as never);
    sendRegistrationEmail.mockRejectedValue(new Error("SES down"));

    const res = await POST(
      jsonRequest({
        email: "new@example.com",
        displayName: "Newbie",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("handles the concurrent-signup race: P2002 then a complete account wins → sign-in link", async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "winner",
      email: "race@example.com",
      preferredLanguage: null,
      passkeys: [{ id: "pk" }],
      emailVerifiedAt: null,
    } as never);
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );

    const res = await POST(
      jsonRequest({
        email: "race@example.com",
        displayName: "Racer",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(sendLoginEmail).toHaveBeenCalledOnce();
    expect(sendRegistrationEmail).not.toHaveBeenCalled();
  });

  it("handles the concurrent-signup race: P2002 then an incomplete row → resumed, registration link", async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "loser",
      email: "race@example.com",
      passkeys: [],
      emailVerifiedAt: null,
    } as never);
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );
    update.mockResolvedValue({
      id: "loser",
      email: "race@example.com",
      passkeys: [],
      emailVerifiedAt: null,
    } as never);

    const res = await POST(
      jsonRequest({
        email: "race@example.com",
        displayName: "Racer",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledOnce();
    expect(sendRegistrationEmail).toHaveBeenCalledOnce();
  });
});
