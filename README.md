# Amen Circle

A small prayer-community web app. People form a circle, each member submits a
prayer request, the owner closes the room, and each request gets shuffled and
assigned to someone other than its author to pray for.

Live at **https://amencircle.com**.

## Stack

- Next.js 16 (App Router, TypeScript strict, Tailwind v4)
- Prisma 6 + Neon (PostgreSQL, pooled)
- Passkey-only auth via `@simplewebauthn/server` and iron-session
- AES-256-GCM encryption at rest for all prayer-request content
- Deployed on AWS Amplify (`WEB_COMPUTE`), Terraform-managed (`infra/`)

## Local development

```bash
# Use the pinned Node version (≥ 22.12 required for Prisma 6)
nvm use

# Install + push the Prisma schema to your Neon dev DB
npm install
npm run db:push

# Run
npm run dev
```

`.env.local` must contain `DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY`,
`WEBAUTHN_RPID`, and `WEBAUTHN_ORIGIN`. For local dev:

```
WEBAUTHN_RPID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
```

Passkey ceremonies only work on `localhost` or HTTPS — `127.0.0.1` will not work.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push `prisma/schema.prisma` to Neon |
| `npm run db:studio` | Open Prisma Studio against `.env.local`'s DB |

## Infrastructure

All AWS resources (Amplify app, IAM role, Route 53 record, domain association)
live in `infra/` as Terraform. Secrets are read from SSM Parameter Store at
build time and snapshotted into `.next/server/runtime-env.json` for the SSR
Lambda — see `src/instrumentation.ts` for the read side.

One manual setting: the Amplify SSR CloudWatch log group is auto-created
outside Terraform — set its retention to **30 days** in the CloudWatch
console. The privacy policy's claim about access-log retention depends on it.

## Legal pages

`/privacy` and `/terms` are drafted from an audit of this codebase's actual
data flows, with operator identity centralised in `src/lib/legal.ts`
(placeholders to fill in). They are **not legal advice** — have a solicitor
review them before relying on them.

## Acknowledgements

- Authenticator names are derived from the community-maintained
  [passkey-authenticator-aaguids](https://github.com/passkeydeveloper/passkey-authenticator-aaguids)
  dataset (MIT) — see `src/lib/passkey-name.ts`.

## License

MIT — see [LICENSE](LICENSE).
