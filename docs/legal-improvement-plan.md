# Legal-Risk Remediation Plan — Amen Circle

This document is the implementation plan for bringing Amen Circle (https://amencircle.com) into a defensible legal posture. It was produced from a full audit of the codebase and infrastructure; every claim below is grounded in actual code paths. Workstreams are independent and can be picked up separately — see the priority order at the end.

> **Not legal advice.** This plan (and any policy/terms text written from it) is a structured draft for a small UK-operated service. Have a solicitor review the privacy policy and terms before relying on them.

## Context

Amen Circle is a prayer-community app: users register (passkey-only auth), form rooms, submit free-text prayer requests, and get assigned each other's requests to pray for. It stores emails, display names, WebAuthn credentials, and prayer content in Neon Postgres, deployed on AWS Amplify (eu-west-2), sending transactional email via SES.

The app currently has **no legal surface at all** despite processing **special-category data** (prayer content reveals religious belief — UK GDPR Art. 9):

- No privacy policy, terms, cookie disclosure, or operator identity anywhere in the UI.
- No consent capture, no age gate, no account deletion (Art. 17), no data export (Art. 15/20).
- Only `isConfidential` requests are encrypted at rest; the rest are plaintext despite `src/lib/crypto.ts` (AES-256-GCM) existing.
- No content report/takedown route or owner member-removal (UGC hosting-liability / Online Safety Act exposure).
- Production emails ship a placeholder postal address unless `EMAIL_POSTAL_ADDRESS` is set (`src/lib/email.ts:47`).
- Zero security headers in `next.config.ts`.
- Public GitHub repo with no LICENSE; leftover Vercel/Next trademark SVGs in `public/`; expired Login/Recovery tokens never purged.
- Clean areas: no analytics/trackers, fonts self-hosted via `next/font`, all deps MIT/Apache/ISC, no committed secrets, session cookie is strictly-necessary (no cookie banner needed, just disclosure).

**Decisions already made:** controller = company/entity (placeholder `[COMPANY NAME / reg. no. / address]` — fill in `src/lib/legal.ts`); age gate = **18+**; repo license = **MIT**.

**Next.js 16 notes** (verified against `node_modules/next/dist/docs/`): `async headers()` in `next.config.ts` unchanged and is the documented path for non-nonce CSP; nonce-based CSP would force full dynamic rendering (rejected — no third-party scripts); middleware is renamed `src/proxy.ts` but is not needed; route handlers must `await params`; schema deploys via `prisma db push` (no migrations dir) so **new columns must be nullable**.

## A. Legal pages + footer

New files:

- `src/lib/legal.ts` — single source of truth: `OPERATOR = { legalName: "[COMPANY]", registeredAddress: "[...]", contactEmail: "[...]" }`, `DOMAIN = "amencircle.com"`, `TERMS_VERSION`/`PRIVACY_VERSION` dates. Hard-code values (static pages can't reliably read Amplify runtime env at prerender).
- `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` — static server components with `export const metadata`.
- `src/components/site-footer.tsx` — © line, links to `/privacy`, `/terms`, `mailto:` "Contact / report content".

Modify `src/app/layout.tsx`: render `<SiteFooter />` after `{children}` so it appears on every page.

Privacy policy sections (grounded in actual data flows):

1. Controller identity: company name, registered address, contact email.
2. Data collected: email, display name, passkey metadata (note: biometrics never leave the device), prayer-request text (**special category** — religious beliefs), room membership, session cookie, IP addresses in AWS CloudWatch access logs.
3. Lawful bases: Art. 6(1)(b) contract for the account/service; **Art. 9(2)(a) explicit consent** for prayer content; legitimate interest for security logs.
4. Processors: Neon (database — confirm its hosting region and note the transfer safeguard if non-UK/EU), AWS Amplify/SES/CloudWatch (eu-west-2, London).
5. Cookies: single strictly-necessary `amen-circle-session` (httpOnly, 30 days) — no consent banner required under PECR for strictly-necessary cookies; say so explicitly. No analytics, no tracking.
6. Encryption at rest: phrase as fully true only once workstream E ships (until then say "confidential requests").
7. Retention: tokens purged after expiry, requests deleted on leave/room-delete/account-delete, access logs 30 days (per H.6).
8. Rights: access, rectification, erasure (in-app deletion — C), portability (in-app export — D), restriction, objection, **withdrawal of consent** (delete requests or account), and the right to complain to the ICO (ico.org.uk).
9. Eligibility: **18+ only**.
10. Changes + last-updated date.

Terms sections: service description; **eligibility 18+**; passkey/account responsibility; user content — user grants a limited licence to store/display their requests to circle members; acceptable use (no unlawful, abusive, harassing content); content reporting/takedown and operator's right to remove content/accounts (ties to F); "other members read what you share" warning; no professional/pastoral advice; if a circle owner deletes their account the circle is deleted (ties to C); "as is" warranty/liability limits; termination; governing law England & Wales.

## B. Consent + age gate at registration

Schema (`prisma/schema.prisma`, `User` — nullable so `db push` succeeds against existing rows):

```prisma
termsAcceptedAt        DateTime?
religiousDataConsentAt DateTime?
ageConfirmedAt         DateTime?
```

Three timestamps because UK GDPR explicit consent must be demonstrable and **unbundled** from terms acceptance.

UI — `src/app/auth/passkey-form.tsx` (register branch): two checkboxes gating the Create-passkey button:

1. "I am **18 or older** and accept the [Terms](/terms) and [Privacy Policy](/privacy)." (age + terms may be combined; only Art. 9 consent must be unbundled)
2. "I explicitly consent to Amen Circle storing and processing the prayer requests I write, which may reveal my religious beliefs. I can withdraw this at any time by deleting my requests or my account."

API — `src/app/api/auth/register/start/route.ts`: extend the body with `acceptTerms`/`consentReligiousData` booleans, return 400 unless both are `true` (server-side enforcement, not just UI); set all three timestamps on `user.create` **and** on the resumed-interrupted-signup update path.

Existing-user backfill (no consent record exists for current users): new `POST src/app/api/my/consent/route.ts` (auth-guarded, sets the timestamps) + `src/components/consent-gate.tsx` rendered from `src/app/dashboard/page.tsx` when `religiousDataConsentAt === null` (extend the select in `src/lib/current-user.ts`), blocking dashboard content until accepted.

## C. Account deletion (Art. 17)

Policy: delete authored requests; null out `assignedToId` where assigned to the user; **delete owned rooms** (consistent with the existing owner room-delete cascade; ownership transfer is over-engineering for an invite-only trust circle — disclose the behavior in the terms).

New `DELETE src/app/api/my/account/route.ts` — ordered `prisma.$transaction` clearing the three non-cascading FKs (`PrayerRequest.authorId`, `PrayerRequest.assignedToId`, `PrayerRoom.ownerId` have no `onDelete`) before the user delete. Schema FK changes are avoided deliberately — no risky `db push` constraint alteration on a live DB:

```ts
prisma.prayerRequest.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } }),
prisma.prayerRequest.deleteMany({ where: { authorId: userId } }),
prisma.prayerRoom.deleteMany({ where: { ownerId: userId } }),   // cascades memberships/requests
prisma.user.delete({ where: { id: userId } }),                   // cascades passkeys/tokens/memberships
```

Then `session.destroy()`.

UI — `src/app/settings/delete-account.tsx` "Danger zone" card reusing `src/components/ui/confirm-dialog.tsx` and the fetch patterns in `passkey-manager.tsx`; link "Download your data first" → export (D); on success redirect to `/`.

## D. Data export (Art. 15/20)

New `GET src/app/api/my/export/route.ts` (auth-guarded, `Content-Disposition: attachment; filename="amen-circle-export.json"`): profile + consent timestamps, passkey metadata (no public keys), memberships, owned rooms, authored requests (decrypted via E's helper). **Omit content of requests assigned to the user** — that is third parties' special-category data.

Settings UI: a plain `<a href="/api/my/export">Download my data</a>` (same-origin cookie auth, works without JS).

## E. Encrypt ALL prayer content at rest

`src/lib/crypto.ts` — add versioned helpers (a `v1:` prefix disambiguates legacy rows, since plaintext could be mistaken for base64):

```ts
encryptContent(pt)                => "v1:" + encrypt(pt)
decryptContent(s, isConfidential) => s.startsWith("v1:") ? decrypt(s.slice(3))
                                     : isConfidential ? decrypt(s) : s   // legacy fallback
```

- Write path: `src/app/api/rooms/[id]/requests/route.ts:47` → always `encryptContent(content)` (`isConfidential` becomes a pure visibility flag).
- Read paths (all three): `src/app/api/my/requests/route.ts:24`, `src/app/my-prayers/page.tsx:39`, `src/app/rooms/[id]/page.tsx:78-82` → `decryptContent(...)`.
- One-shot idempotent migration `scripts/encrypt-plaintext-requests.js` (follows the `scripts/mint-recovery-link.js` precedent; package.json script with `dotenv -e .env.local`; run against prod `DATABASE_URL`): for rows without `v1:` — confidential rows get the prefix prepended (same ciphertext format), plaintext rows get `encryptContent`. Keep the legacy fallback in `decryptContent` afterwards as a safety net.

## F. Report/takedown + member removal

- Footer "Report content" mailto (from A) + a takedown section in the terms. Optional: per-item "Report" mailto link in `src/app/my-prayers/page.tsx` (the only place users see others' content) prefilling the request id.
- Member removal (does not exist today): new `DELETE src/app/api/rooms/[id]/members/[userId]/route.ts` — owner-only, room must be OPEN, target must be a non-owner member; transaction mirrors the leave route (`deleteMany` the target's requests + delete the membership). `params` is a Promise in Next 16 — await it. UI: `remove-member-button.tsx` (ConfirmDialog + fetch + `router.refresh()`) in the members aside of `src/app/rooms/[id]/page.tsx` when `isOwner && isOpen`. Add a route test following `src/app/api/rooms/[id]/leave/route.test.ts`.

## G. Security headers

`next.config.ts` — `async headers()` on `/(.*)`:

- CSP: `default-src 'self'`; `script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` dev-only); `style-src 'self' 'unsafe-inline'`; `img-src 'self' blob: data:`; `font-src 'self'`; `connect-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Rationale: no third-party runtime origins exist (SES is server-side, fonts self-hosted), so `'self'` everywhere; `'unsafe-inline'` is unavoidable without nonces, and nonces would force full dynamic rendering for zero real gain. WebAuthn needs no CSP directives. After deploy, `curl -I` prod to confirm Amplify WEB_COMPUTE serves the headers on both SSR and static responses; fall back to a `customHttp.yml` with the same set if static assets miss them.

## H. Housekeeping

1. **LICENSE (MIT)**: add `LICENSE` with MIT text, © 2026 [COMPANY]; add `"license": "MIT"` to package.json (keep `"private": true` — it only blocks npm publish); README `## License` section + the not-legal-advice caveat for the policy drafts.
2. Delete unused scaffolding SVGs: `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg` (verified unreferenced — the Vercel/Next logos are trademarks we shouldn't ship).
3. README "Acknowledgements": aaguid data from passkey-authenticator-aaguids (MIT) — `src/lib/passkey-name.ts` already cites it in a comment.
4. **EMAIL_POSTAL_ADDRESS** (set to the company's registered address — required by anti-spam rules, currently a placeholder in prod) — three places, matching the `email_from` pattern: `infra/variables.tf` new variable; `infra/main.tf` Amplify branch `environment_variables`; **and `amplify.yml` (~line 20)** — add it to the runtime-env.json snapshot or the SSR Lambda never sees it (`src/instrumentation-node.ts` loads the file generically, no code change needed).
5. Expired-token purge: in `src/instrumentation-node.ts` after the existing `$connect()` warm-up, best-effort `deleteMany` of `LoginToken`/`RecoveryToken` rows with `expiresAt < now − 24h`, wrapped in try/catch that swallows failures (must never crash init). Runs on every Lambda cold start — plenty for this scale; both models already have `@@index([expiresAt])`.
6. CloudWatch log retention 30 days (console, or `aws_cloudwatch_log_group` in `infra/main.tf` if the auto-created group is adoptable) — backs the privacy policy's retention claim about IP logs.

## Priority order

1. **Legally urgent (first deploy):** A + B + H.4 (+ G rides along — small and independent). Without these the app processes Art. 9 data with no lawful basis, no controller identity, and no policies.
2. **Rights plumbing:** C + D (until shipped, the policy can say "email us" as a stopgap) + E (sequence with/before the policy wording that claims full at-rest encryption).
3. **Moderation + tidy-up:** F, H.1–3, H.5–6.

## Verification (for implementers)

- `npm run lint`, `npm run build`, `npx vitest run` (existing route tests + the new member-removal test).
- Local: `npm run db:push`; register a fresh user — checkboxes required (and the API returns 400 without them via curl); timestamps visible in Prisma Studio. An existing user hits the consent gate on /dashboard.
- Submit a non-confidential request; confirm the DB row starts `v1:` and renders decrypted in the room page, /my-prayers, and the export JSON. Run the migration script twice against a DB with legacy rows (idempotency check).
- Delete-account flow: a user with an owned room + authored + assigned requests — verify no orphans or FK errors; session cleared.
- `curl -I` for all security headers; check /privacy and /terms render and the footer appears on every page.
- Confirm the production email footer shows the real postal address.
