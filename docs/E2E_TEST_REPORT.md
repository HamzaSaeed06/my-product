# End-to-End Test Report — Customer Journey (Provider → Product)

**Started:** 2026-09-13
**Goal (user's ask):** test the whole thing start-to-end the way a real customer experiences it — what comes from the **provider** side (onboarding/license), then the **product** step by step to the end.
**Environment:** dev — product-web `:3000` → product-api `:4000` → Neon dev DB. Browser pane drives the UI; API/DB checks back it up.

**Login used for the product walkthrough:** `admin@myproduct.local` / `Verify123!Pass` (SUPER_ADMIN; password reset to a known value for this test).

---

## Automated coverage already in place (the E2E backbone)

- **Full API integration suite: 53 files, 398 tests — all passing** (local Postgres, real HTTP layer) — this exercises every module's happy path + negative/scope/IDOR cases end-to-end at the API level.
- **Per-role portal data verification** (this session): Teacher / Parent / Student authenticated fetches — all scope-correct (see PROJECT_STATUS (bc)).
- **Scope-enforcement** 19/19, **results** 14/14, **unit** 25/25.

The browser walkthrough below adds the *human* end-to-end: does a real user, clicking through, get a working, coherent product.

---

## Stage 1 — Provider side (operator onboards a customer, issues a license)

**Status: DOCUMENTED — setup-gated.** The provider control plane (`provider/api` :4100 + `provider/web` :3100, separate DB + generated client at `provider/api/src/generated/prisma`) is a separate app stack not in `.claude/launch.json`. Standing it up for a live browser pass needs: generate its Prisma client, migrate/seed its DB, create a provider admin (`npm run create-provider-admin`), start both servers. The license it issues is a signed JWT the product consumes via `LICENSE_JWT` (product runs unrestricted as `NOT_CONFIGURED` when absent — current dev state). Flow to test when stood up: provider login → Customers → Plans → Deployments → issue License → copy JWT → set `LICENSE_JWT` in product → product runs under plan limits.

_(Verified structurally: provider modules customers/plans/deployments/licenses/support exist; product-side `license.ts` verifies + computes state independently, no call-home.)_

---

## Stage 2 — Product side (the customer's actual daily journey)

Walkthrough as SUPER_ADMIN, module by module. Each row: what was tested → result.

| # | Step | Result |
|---|------|--------|
| _(filled in as the walkthrough proceeds)_ | | |
