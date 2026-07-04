# Amen Circle

A small prayer-community web app. People form a circle, each member submits a
prayer request, the owner closes the room, and each request gets shuffled and
assigned to someone other than its author to pray for. Assignees can mark a
request as prayed for, authors can mark their own request as answered, and
requests can be flagged confidential.

Live at **https://amencircle.com**.

## Stack

- Next.js 16 (App Router, TypeScript strict, Tailwind v4)
- Prisma 6 + Neon (PostgreSQL, pooled)
- Passkey-first auth via `@simplewebauthn/server` and iron-session, with an
  email magic-link sign-in fallback and email-based account recovery
- Transactional email via AWS SES (`@aws-sdk/client-ses`)
- AES-256-GCM encryption at rest for all prayer-request content
- Vitest for unit/route tests
- Deployed on AWS Amplify (`WEB_COMPUTE`), Terraform-managed (`infra/`)

## Local development

```bash
# Use the pinned Node version (≥ 22.12 required for Prisma 6)
nvm use

# Install
npm install

# Bring up a local Postgres (localhost:5433), or point DATABASE_URL at Neon
docker compose up -d

# Push the Prisma schema to your dev DB
npm run db:push

# Run
npm run dev
```

`.env.local` must contain `DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY`,
`WEBAUTHN_RPID`, and `WEBAUTHN_ORIGIN`. Email sending additionally needs
`EMAIL_FROM`, `SES_REGION`, `SES_ACCESS_KEY_ID`, and `SES_SECRET_ACCESS_KEY`
(optionally `EMAIL_REPLY_TO` and `EMAIL_POSTAL_ADDRESS`); without them the app
runs but the email login/recovery flows will error at send time. For local dev:

```
WEBAUTHN_RPID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/amen_circle
```

Passkey ceremonies only work on `localhost` or HTTPS — `127.0.0.1` will not work.

Email templates can be previewed without sending at `/dev/emails` (dev only).

## Testing

```bash
npm test          # run once
npm run test:watch
```

Tests live next to the code they cover as `*.test.ts` (route handlers and lib
helpers).

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run db:push` | Push `prisma/schema.prisma` to the DB |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:studio` | Open Prisma Studio against `.env.local`'s DB |
| `npm run recovery-link` | Mint a recovery link for a user (support/manual) |
| `npm run encrypt-requests` | Backfill-encrypt any plaintext prayer requests |

## Infrastructure

All AWS resources (Amplify app, IAM role, SES identity, Route 53 record, domain
association) live in `infra/` as Terraform. Secrets are read from SSM Parameter
Store at build time and snapshotted into `.next/server/runtime-env.json` for the
SSR Lambda — see `src/instrumentation.ts` for the read side, and `amplify.yml`
for the snapshot step.

Email: the SSR Lambda has no assumable role for the AWS SDK, so SES is accessed
via an explicit, tightly-scoped IAM access key (`SES_*` env vars). A new SES
account starts in the **sandbox** (can only send to verified addresses) — request
production access in the SES console. DKIM records are managed in Terraform.

One manual setting: the Amplify SSR CloudWatch log group is auto-created
outside Terraform — set its retention to **30 days** in the CloudWatch
console. The privacy policy's claim about access-log retention depends on it.

## Legal pages

`/privacy` and `/terms` are drafted from an audit of this codebase's actual
data flows, with operator identity centralised in `src/lib/legal.ts`
(placeholders to fill in). Consent (UK GDPR, including Art. 9 explicit consent
for prayer content) is recorded per-user and gated in-app via `ConsentGate`.
The pages are **not legal advice** — have a solicitor review them before relying
on them.

## Acknowledgements

- Authenticator names are derived from the community-maintained
  [passkey-authenticator-aaguids](https://github.com/passkeydeveloper/passkey-authenticator-aaguids)
  dataset (MIT) — see `src/lib/passkey-name.ts`.

## License

MIT — see [LICENSE](LICENSE).
