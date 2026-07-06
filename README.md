# Amen Circle

A small prayer-community web app. People form a circle, each member submits a
prayer request, the owner closes the room, and each request gets shuffled and
assigned to someone other than its author to pray for. Assignees can mark a
request as prayed for, authors can mark their own request as answered, and
requests can be flagged confidential.

Live at **https://amencircle.com**.

## Stack

- Next.js 16 (App Router, TypeScript strict, Tailwind v4)
- Prisma 6 + PostgreSQL 17
- Passkey-first auth via `@simplewebauthn/server` and iron-session, with an
  email magic-link sign-in fallback and email-based account recovery
- Transactional email via AWS SES (`@aws-sdk/client-ses`)
- AES-256-GCM encryption at rest for all prayer-request content
- Vitest for unit/route tests
- Deployed on an EC2 server as a Docker Compose stack (app + Postgres) behind
  CloudFront; DNS/CDN/SES are Terraform-managed (`infra/`)

## Local development

```bash
# Use the pinned Node version (≥ 22.12 required for Prisma 6)
nvm use

# Install
npm install

# Bring up a local Postgres (localhost:5433)
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

The app runs on an EC2 server as a Docker Compose stack
(`docker-compose.prod.yml`: Next.js standalone image + PostgreSQL 17) behind
the server's shared nginx (`deploy/nginx-amencircle.conf`). TLS terminates at
CloudFront, which authenticates to nginx with a secret `X-Origin-Verify`
header, so the origin cannot be reached directly. AWS resources (CloudFront
distributions, ACM certs, SES identity, Route 53 records) live in `infra/` as
Terraform; runtime secrets live in `.env.production` on the server (mirrored
in SSM Parameter Store).

Deploys: `DEPLOY_HOST=ubuntu@<server> ./scripts/deploy.sh` (builds on the
server from `origin/main` and health-checks before finishing). The
Amplify→EC2 migration runbook is in `deploy/cutover-runbook.md`.

Email: SES is accessed via an explicit, tightly-scoped IAM access key
(`SES_*` env vars) rather than the shared server's instance role. A new SES
account starts in the **sandbox** (can only send to verified addresses) —
request production access in the SES console. DKIM records are managed in
Terraform.

Access logs are nginx's on the server; the privacy policy claims a 30-day
retention, so keep `/etc/logrotate.d/nginx` at or below that (Ubuntu's
default of 14 daily rotations is fine). App/db container logs are size-capped
in `docker-compose.prod.yml`.

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
