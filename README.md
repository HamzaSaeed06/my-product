# Education Institution Management Platform

White-label, single-tenant school/academy/institute management platform.
Full specification: [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md). Current
build status: [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md). Phase
roadmap: [`docs/PHASE_TRACKER.md`](docs/PHASE_TRACKER.md).

**Start with `docs/README.md` if you're picking this project up cold.**

## Repo layout

```
product/api/      Express + TypeScript + Prisma backend
product/web/       Next.js 16 + shadcn/ui frontend (login + dashboard shell so far)
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

Then, in another terminal, the frontend:

```bash
cp product/web/.env.example product/web/.env.local   # API_URL defaults to http://localhost:4000
cd product/web && npm run dev                         # start the web app on :3000
```

Open `http://localhost:3000/login` and sign in with the Super Admin you
created above.

## Testing

```bash
npm run test:api                # unit tests, no DB needed
npm run test:api:integration    # 30 integration tests against a REAL database — writes/reads real rows
```

`test:api:integration` requires `product/api/.env`'s `DATABASE_URL` to point
at a real, reachable Postgres — it is not safe to run against a database you
care about without reading what it does first (see
`product/api/tests/integration/`). `product/web` has no automated tests yet;
its login/dashboard flow was verified manually via curl — see
`docs/PROJECT_STATUS.md` §1b.

## Conventions

See `docs/README.md` — authorization model, no-hard-delete policy, audit vs.
activity log, shadcn/ui UI requirement, session-log update expectation.
