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

### Deploys

Every push to `main` deploys automatically via GitHub Actions
(`.github/workflows/deploy.yml`): checks (lint, tests, build) → Docker image
built and pushed to `ghcr.io/iphren/amen-circle` (tagged `sha-<commit>` +
`latest`) → `prisma db push` over an SSH tunnel → the server pulls the image
and restarts the stack, gated on a health check. Pull requests get the same
checks plus a `schema-diff` comment showing the SQL any `schema.prisma`
change implies (`.github/workflows/ci.yml`).

**Rollback:** run the Deploy workflow manually (`workflow_dispatch`) with the
full SHA of a previously built image. This skips checks, build, and
`db push` (schema is never rolled back automatically) and redeploys that
image.

**Manual deploy** still works from any machine with SSH + GHCR access:

```bash
DEPLOY_HOST=ubuntu@<server> GHCR_TOKEN="$(gh auth token)" ./scripts/deploy.sh
```

(`gh auth token` needs the `read:packages` scope: `gh auth refresh -s
read:packages`. `IMAGE_TAG=sha-<commit>` selects a specific image; default
`latest`.)

**Schema changes:** additive changes are applied by the deploy workflow
automatically. `prisma db push` runs *without* `--accept-data-loss`, so a
change that would lose data fails the deploy while the old app keeps running.
Apply those deliberately by hand:

```bash
ssh -N -L 15432:127.0.0.1:15432 ubuntu@<server> &
DATABASE_URL=postgresql://postgres:<password>@localhost:15432/amen_circle \
  npx prisma db push --accept-data-loss
```

**Repo secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | `ubuntu@<server>` |
| `DEPLOY_SSH_KEY` | private half of the dedicated ed25519 deploy keypair (public half in the server's `authorized_keys`) |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan -H <server>` output, captured once from a trusted machine |
| `PROD_DATABASE_URL` | `postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:15432/amen_circle` — **must be updated together with** `POSTGRES_PASSWORD` in the server's `.env.production` if the password is ever rotated |

Everything else (GHCR push/pull auth) uses the workflow's ephemeral
`GITHUB_TOKEN`; no PATs are stored anywhere, including on the server.

Note: deploys no longer update the server's git checkout at
`/home/ubuntu/apps/amen-circle` (they `scp` the compose file instead).
Cron'd scripts there (`scripts/backup-db.sh`) keep working but only pick up
changes after a manual `git pull` on the server.

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
