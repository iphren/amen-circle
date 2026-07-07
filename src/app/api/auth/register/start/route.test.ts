import { describe, it, expect, beforeEach, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/passkey-enroll", () => ({ buildEnrollmentOptions: vi.fn() }));

import { POST } from "@/app/api/auth/register/start/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildEnrollmentOptions } from "@/lib/passkey-enroll";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Valid consent flags, spread into request bodies that should pass the gate.
const consented = { acceptTerms: true, consentReligiousData: true };

function fakeSession() {
  return { save: vi.fn().mockResolvedValue(undefined) } as Record<
    string,
    unknown
  > & { save: ReturnType<typeof vi.fn> };
}

const findUnique = vi.mocked(prisma.user.findUnique);
const create = vi.mocked(prisma.user.create);
const update = vi.mocked(prisma.user.update);
const enrollOpts = vi.mocked(buildEnrollmentOptions);
const session = vi.mocked(getSession);

beforeEach(() => {
  vi.clearAllMocks();
  enrollOpts.mockResolvedValue({
    options: { challenge: "chal" } as never,
    challenge: "chal",
  });
});

describe("register/start — account-takeover guard", () => {
  it("rejects when the email already has a passkey (409)", async () => {
    findUnique.mockResolvedValue({
      id: "victim",
      passkeys: [{ id: "pk1" }],
    } as never);

    const res = await POST(
      jsonRequest({
        email: "victim@example.com",
        displayName: "Mallory",
        ...consented,
      }),
    );

    expect(res.status).toBe(409);
    expect(create).not.toHaveBeenCalled();
    expect(enrollOpts).not.toHaveBeenCalled();
  });

  it("rejects a zero-passkey account whose email is verified (409)", async () => {
    // An email-registered account (completed via an emailed link) has no
    // passkeys but must not be claimable as an "interrupted signup".
    findUnique.mockResolvedValue({
      id: "emailuser",
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

    expect(res.status).toBe(409);
    expect(update).not.toHaveBeenCalled();
    expect(enrollOpts).not.toHaveBeenCalled();
  });

  it("creates a passkey enrollment for a brand-new email (200)", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({
      id: "newuser",
      email: "new@example.com",
      displayName: "Newbie",
      passkeys: [],
    } as never);
    const s = fakeSession();
    session.mockResolvedValue(s as never);

    const res = await POST(
      jsonRequest({
        email: "New@Example.com",
        displayName: " Newbie ",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
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
    expect(enrollOpts).toHaveBeenCalledWith("newuser");
    expect(s.pendingUserId).toBe("newuser");
    expect(s.challenge).toBe("chal");
    expect(s.save).toHaveBeenCalledOnce();
  });

  it("resumes registration for an existing user that has zero passkeys (200)", async () => {
    findUnique.mockResolvedValue({
      id: "halfsignup",
      passkeys: [],
    } as never);
    update.mockResolvedValue({
      id: "halfsignup",
      passkeys: [],
    } as never);
    const s = fakeSession();
    session.mockResolvedValue(s as never);

    const res = await POST(
      jsonRequest({
        email: "half@example.com",
        displayName: "Half",
        ...consented,
      }),
    );

    expect(res.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
    // Resume refreshes the display name and re-records consent.
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
    expect(enrollOpts).toHaveBeenCalledWith("halfsignup");
    expect(s.pendingUserId).toBe("halfsignup");
  });

  it("returns 400 when email or displayName is missing", async () => {
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
    expect(create).not.toHaveBeenCalled();
  });

  it("handles the concurrent-signup race: P2002 then a real account wins (409)", async () => {
    // First lookup: no row yet. create() loses the race and throws P2002.
    // Re-fetch finds the now-existing account, which already has a passkey.
    findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "winner", passkeys: [{ id: "pk" }] } as never);
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

    expect(res.status).toBe(409);
    expect(enrollOpts).not.toHaveBeenCalled();
  });

  it("handles the race when the winner is a verified email-registered account (409)", async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "winner",
      passkeys: [],
      emailVerifiedAt: new Date(),
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

    expect(res.status).toBe(409);
    expect(update).not.toHaveBeenCalled();
    expect(enrollOpts).not.toHaveBeenCalled();
  });
});
