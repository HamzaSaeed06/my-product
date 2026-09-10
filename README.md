# Education Institution Management Platform

White-label, single-tenant school/academy/institute management platform.
Full specification: [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md). Current
build status: [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md). Phase
roadmap: [`docs/PHASE_TRACKER.md`](docs/PHASE_TRACKER.md).

**Start with `docs/README.md` if you're picking this project up cold.**

## Repo layout

```
product/api/      Express + TypeScript + Prisma backend
product/web/       Next.js frontend (not scaffolded yet)
packages/shared/   Shared types/schemas (empty until 2+ apps need something in common)
docs/              Spec, status, phase tracker
```

## Prerequisites

- Node.js 20+ (developed against v24)
- A PostgreSQL 15+ database (local, Docker, or hosted) for `product/api`

## Setup

```bash
npm install                                    # installs all workspaces
cp product/api/.env.example product/api/.env   # then fill in DATABASE_URL and generate secrets:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

npm run prisma:generate                        # generate the Prisma client
npm run prisma:migrate --workspace=product/api -- --name init   # create the DB schema
npm run prisma:seed --workspace=product/api    # seed the 7 core roles + Phase 0 permissions

# create the first Super Admin (no self-registration by design)
npm run create-super-admin --workspace=product/api -- --email you@school.com --password "Str0ng!Pass1" --name "Your Name"

npm run dev:api                                # start the API on :4000
```

## Testing

```bash
npm run test:api
```

Runs unit tests (password hashing, tokens) and one integration test
(`/health`) that don't require a database. Full DB-backed auth flow tests
(login → session → refresh → logout against a real Postgres) are pending —
see `docs/PROJECT_STATUS.md`.

## Conventions

See `docs/README.md` — authorization model, no-hard-delete policy, audit vs.
activity log, shadcn/ui UI requirement, session-log update expectation.
