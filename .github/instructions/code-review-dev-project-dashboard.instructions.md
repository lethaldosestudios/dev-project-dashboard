---
description: 'Code review instructions for lethaldosestudios/dev-project-dashboard (Next.js 15 + Cloudflare Workers + D1)'
applyTo: '**'
excludeAgent: ["coding-agent"]
---

# Code Review Instructions — Dev Project Dashboard

Code review guidelines tailored to this repository: a solo-use, self-hosted project
dashboard built on Next.js 15 (App Router), TypeScript, Tailwind, and Cloudflare
Workers with a D1 (SQLite) database via OpenNext. Reviews should reflect that this is
a single-tenant hobby/personal-infra project, not a multi-tenant SaaS product — apply
judgment about what actually matters at this scale rather than a generic enterprise
checklist.

## Review Language

Respond in **English**.

## Project Context (read before reviewing)

- **Single user, single tenant.** Porter is the only user. There is no multi-tenant
  data isolation to verify — but there IS a single trust boundary: anything reachable
  over the public internet without a session/password check is reachable by anyone.
- **Runtime is Cloudflare Workers**, not Node. Code ships through
  `@opennextjs/cloudflare`. Flag any Node-only API usage that isn't covered by the
  `nodejs_compat` compatibility flag, and flag long-running/blocking work in request
  handlers — Workers have CPU time limits, there's no persistent background process.
- **Database is Cloudflare D1** (SQLite), accessed directly via `db.prepare(...).bind(...)`
  in `src/lib/db.ts` and the API routes — there is no ORM. This raises the bar on manual
  query review (see Security below) but also means "N+1 query" concerns are about D1
  round-trips specifically, and D1 has its own row/query-count limits worth keeping in mind
  for anything that loops and queries per-iteration (see `sync/github/route.ts`'s
  per-repo, per-event query pattern as the existing baseline — new code should not make
  this pattern worse without reason).
- **A minimal Jest suite exists** (ts-jest + @testing-library/react, 2 component
  suites). Don't block merges solely for "missing tests" — see Testing Standards below
  for what to actually flag.
- **Phased build (see `README.md` and `TODO.md`).** Phases 1–3 (CRUD, search, GitHub
  sync/stale detection, bookmarklet capture) are complete. Phase 4 is "Polish &
  Iterate" (next) and Phase 5 is "Optional AI features" (deferred). AI-assisted
  development (`AI-DEV-WORKFLOW.md`) is a separate, orthogonal dev-time workflow used
  to build the repo — **not** a roadmap phase and **not** a runtime feature. When
  reviewing a PR, check that its scope matches the phase it claims to belong to, and
  flag scope creep into explicitly-deferred features (browser extension, AI chat over
  projects, drag-to-reorder, Vercel deploy widgets).

## Review Priorities

### 🔴 CRITICAL (Block merge)
- **Secrets in code or bundle**: `GITHUB_PAT`, `DASHBOARD_PASSWORD`, or the dev-time
  NVIDIA model API keys (DeepSeek/Kimi/Nemotron) hardcoded, committed, logged, added to
  `.env.example` with a real value, or reachable from client-side/browser bundle code.
  Per `AI-DEV-WORKFLOW.md`, the dev-time model keys must **never** appear in
  `.env.example`, the browser bundle, the deployed runtime, or source control — treat
  any PR that wires those keys into `src/app/**` or `src/lib/**` (i.e., into the shipped
  app rather than a dev-only script/tool) as critical.
- **SQL injection / raw string interpolation into D1 queries**: any `db.prepare(...)`
  call built with template-literal interpolation of request input instead of `?`
  placeholders + `.bind(...)`. The existing codebase is consistently parameterized
  (see `src/app/api/projects/route.ts`, `src/app/api/capture/route.ts`) — hold new code
  to the same standard.
- **Unauthenticated write/mutation routes with real-world consequence**: this is
  single-user, so the concern isn't cross-tenant access — it's that any exposed
  `POST`/`PATCH` route is a public, unauthenticated write endpoint by default (per
  README §2, auth is Cloudflare Access or a fallback password/session cookie, not yet
  fully wired everywhere). Flag any new mutation route that doesn't respect whatever
  auth mechanism is in place for it, and flag any route that trusts a client-supplied
  identity/token without validating it server-side.
- **Data loss risk**: destructive operations (deletes, bulk updates) on `projects`,
  `resources`, `notes`, `github_activity` without a guard (e.g., soft-delete via
  `archived_at`, confirmation, or scoping by id) — the schema already favors soft
  deletion (`archived_at` on `projects`) where it exists; don't bypass it with a hard
  `DELETE`.
- **Breaking a Worker deploy**: changes that would fail under the Workers runtime
  (Node-only APIs without `nodejs_compat` coverage, filesystem access, missing
  `async: true` on `getCloudflareContext`, etc.) or that skip updating `wrangler.jsonc`
  bindings when a new D1 table/binding is introduced.

### 🟡 IMPORTANT (Requires discussion)
- **Schema drift**: any change to `db/schema.sql` without a corresponding numbered file
  in `db/migrations/` (following the `0001_init.sql` pattern), or a migration that isn't
  reflected back in `schema.sql`. The two must stay in sync.
- **Validation drift from the established pattern**: routes in this repo validate by
  hand — `typeof` checks, trimming, explicit length limits, `Set`-based enum
  allowlists (see `priorities` in `projects/route.ts`, `allowedSavedVia` in
  `capture/route.ts`). New routes that skip validation entirely, or that silently
  accept unbounded string lengths, should be flagged even though there's no shared
  validation library — consistency with the existing hand-rolled pattern is the bar
  until/unless the project adopts one.
- **Inconsistent API response shape**: existing routes return `{ error }` on failure
  and `{ ok: true, ... }` or a direct resource payload on success, with appropriate
  status codes (400 for validation, 401 for missing auth token, 500 for unexpected
  failure — see `sync/github/route.ts`). New routes drifting from this shape make the
  frontend harder to reason about.
- **GitHub sync robustness**: `src/lib/github.ts` / `sync/github/route.ts` do
  per-repo, per-event work inside a loop with try/catch per repo so one bad repo
  doesn't kill the whole sync. Preserve that isolation in any changes — don't let a
  single failure abort the whole `POST /api/sync/github` run silently, and don't
  regress the "skip archived repos" / dedupe-by-`external_id` behavior.
- **Client/server boundary correctness**: App Router components should only use
  `"use client"` where actually needed (state, effects, event handlers). Flag
  unnecessary client components, and flag server-only logic (DB access, secrets)
  that's reachable from a client component.
- **Stale-detection and date logic**: `isRepoStale` and last-activity calculations use
  a 14-day threshold and timestamp comparisons — changes to this logic should be
  reviewed for correct handling of null/missing timestamps (the existing code already
  treats "no activity data" as stale; don't accidentally invert that).

### 🟢 SUGGESTION (Non-blocking improvements)
- **Readability**: unclear naming, logic that could be simplified, deeply nested
  conditionals in route handlers.
- **Type safety**: use of `any` (e.g., `const body = (await req.json()) as any;` in
  `projects/route.ts`) where a narrower type or a small runtime-validated shape would
  catch bugs earlier — worth suggesting incrementally, not worth blocking on.
- **Tailwind/UI consistency**: new UI should follow the existing dark-mode-by-default,
  glass/glow accent styling already established in `src/components/ui/` (`glass-card`,
  `glow-input`, `liquid-button`) rather than introducing a new visual language.
- **Documentation**: missing updates to `README.md` (roadmap checklist, phase status)
  or `TODO.md` when a PR completes or defers tracked work — this repo actively uses
  both as living status docs, so a feature landing without an update there is worth a
  nudge.

## General Review Principles

1. **Be specific**: reference exact files and lines (e.g., `src/app/api/resources/route.ts`).
2. **Explain why it matters**, especially for the Workers/D1-specific concerns above —
   these aren't generic best practices, they're constraints of this runtime.
3. **Suggest concrete fixes**, ideally matching the existing code's own idioms rather
   than introducing a new pattern or dependency.
4. **Be pragmatic about scale**: this is a $0–1/month solo project (README §1 success
   criteria). Don't push enterprise-grade abstraction, config layers, or process for
   their own sake.
5. **Recognize good practices** — call out when a PR correctly follows the
   parameterized-query / manual-validation / soft-delete conventions already in place.
6. **Group related comments** rather than repeating the same note per occurrence.

## Security Review

- **Sensitive data**: no `GITHUB_PAT`, `DASHBOARD_PASSWORD`, session secrets, or
  dev-time NVIDIA model API keys in code, logs, error messages, or client-visible
  responses.
- **Input validation**: all request bodies parsed defensively (wrap `req.json()` in
  try/catch per the `capture/route.ts` pattern), all string inputs trimmed and
  length-checked, all enum-like fields checked against an explicit allowlist.
- **SQL injection**: every D1 query uses `?` placeholders with `.bind()` — never
  string-concatenate user input into a query.
- **URL handling**: user-supplied URLs (resource capture, project links) should be
  validated with `new URL(...)` and restricted to `http:`/`https:` protocols, per the
  existing pattern in `capture/route.ts` — flag anything that accepts arbitrary
  schemes (`javascript:`, `file:`, etc.) unfiltered.
- **Auth/session**: verify any new protected route actually checks whatever auth
  mechanism applies (Cloudflare Access header/claim, or the password/session cookie
  fallback) rather than relying on obscurity of the URL.
- **Third-party tokens**: the GitHub sync flow currently reads a PAT from an
  `x-github-token` request header per-call (README §7) rather than a stored secret —
  flag if a PR logs this header, forwards it somewhere unexpected, or persists it to D1
  in plaintext.

## Testing Standards

The repo has a minimal Jest suite (ts-jest + @testing-library/react, 2 component
suites) — treat it as a light safety net, not full coverage. So:
- **Don't block a PR purely for "no tests" or low coverage.**
- **Do flag** silent failure modes in critical paths — the sync job, capture dedupe
  logic, and validation logic are the highest-value places for a bug to hide
  unnoticed given there's no automated safety net. If a PR touches
  `POST /api/sync/github`, `POST /api/capture`, or D1 schema/migration files, a
  reviewer should mentally trace the failure/edge cases (empty results, malformed
  GitHub payloads, duplicate URLs, missing project links) even without a test to back
  it up.
- **If a PR does add tests**, apply the general standards: descriptive names, specific
  assertions, edge cases (empty collections, null timestamps, malformed URLs),
  independence from external state.
- **Verification in lieu of tests**: this repo documents manual verification steps in
  `TODO.md` (e.g., "TypeScript, `next build`, OpenNext build, and local Cloudflare
  preview all pass... returned HTTP 200"). A PR description following that pattern is
  an acceptable substitute for automated tests at this project's current stage —
  reviewers should expect it and can ask for it if missing on a nontrivial change.

## Performance Considerations

- **D1 query count**: loops that issue a query per iteration (the GitHub sync route
  already does this deliberately, with per-repo error isolation) should be reviewed for
  whether they'll blow up on a larger repo/event count. Prefer batching or a single
  query with `IN (...)` where D1 supports it and the change is low-risk.
- **Workers CPU time**: avoid heavy synchronous computation or unbounded loops in
  request handlers — there's a per-request CPU limit on Workers.
- **Pagination**: GitHub API calls already use `perPage` params — new calls to
  `fetchUserRepos`/`fetchRepoEvents`/etc. should set sane limits rather than fetching
  unbounded result sets.

## Architecture and Design

- **Follow the existing structure** documented in `README.md` §3: route handlers in
  `src/app/api/**/route.ts`, shared DB helpers in `src/lib/db.ts`, GitHub client logic
  in `src/lib/github.ts`, shared types in `src/types/index.ts`. New cross-cutting logic
  belongs in `src/lib/`, not duplicated inline in route handlers.
- **Keep `REPO_TO_PROJECT`-style hardcoded mappings on the radar**: `src/lib/github.ts`
  notes the repo→project mapping "should eventually come from project settings in the
  DB" — the route already has a DB-lookup fallback. Don't add new features that
  deepen the hardcoded-mapping approach instead of migrating toward the DB-backed one.
- **Respect the phase boundary**: the AI development tooling (see `AI-DEV-WORKFLOW.md`)
  is explicitly a dev-time aid, not a dashboard feature — code introducing runtime
  routes, UI, or dependencies on the NVIDIA models inside `src/app/**` should be
  questioned unless the PR is deliberately implementing Phase 5 "Optional AI features"
  as an in-app product direction.

## Documentation Standards

- **README.md** roadmap checklist and phase-status sections (§6–§9) should be updated
  when a PR completes, changes, or defers tracked work.
- **TODO.md** is the running log for known issues and deferred work — new deferred
  work discovered during a PR should be recorded there, not left implicit.
- **Public API routes**: new routes under `src/app/api/` should get a one-line comment
  header (matching the `// src/app/api/projects/route.ts` convention already used) and
  a corresponding line added to the relevant README status section.

## Comment Format Template

```markdown
**[PRIORITY] Category: Brief title**

Detailed description of the issue or suggestion.

**Why this matters:**
Explanation of the impact, framed in terms of this repo's actual runtime (Cloudflare
Workers/D1) or its single-user trust model — not generic enterprise reasoning.

**Suggested fix:**
[code example, ideally matching an existing pattern in the repo]
```

### Example Comments

#### Critical Issue
````markdown
**🔴 CRITICAL - Security: Unauthenticated mutation route**

`POST /api/projects/[id]/archive` (new in this PR) performs a destructive update with
no auth check. Every other mutation route in this repo either checks the session or is
explicitly documented as dev-only (like the `x-github-token` header on sync). This
route has neither.

**Why this matters:**
This app is deployed to a public Cloudflare Workers URL. Without an auth check, anyone
who finds the URL can archive projects.

**Suggested fix:**
Add the same auth check used elsewhere (Cloudflare Access header / session cookie)
before performing the update, and return 401 if it's missing — matching the pattern in
`sync/github/route.ts`.
````

#### Important Issue
````markdown
**🟡 IMPORTANT - Consistency: Schema changed without a migration file**

`db/schema.sql` now has a `github_repo` column on `projects`, but there's no matching
file in `db/migrations/`.

**Why this matters:**
`schema.sql` and `db/migrations/*.sql` need to stay in sync — anyone running the
migration files against an existing D1 database won't get this column, and the two
setup paths documented in `README.md` §4 will diverge.

**Suggested fix:**
Add `db/migrations/0002_add_github_repo.sql` with the `ALTER TABLE` statement.
````

#### Suggestion
````markdown
**🟢 SUGGESTION - Type safety: Replace `as any` with a narrower type**

`const body = (await req.json()) as any;` in the new route loses type checking on the
request body.

**Why this matters:**
A small inline type (or reusing a type from `src/types/index.ts`) would catch typos in
field access at compile time.

**Suggested fix:**
```typescript
const body = (await req.json()) as { name?: string; priority?: string };
```
````

## Review Checklist

### Code Quality
- [ ] Consistent with existing route-handler and `src/lib/` conventions
- [ ] No unnecessary `"use client"` on components that don't need it
- [ ] No unexplained `any` on request/response shapes where a narrow type is easy
- [ ] No dead code, commented-out code, or untracked TODOs (untracked = not in `TODO.md`)

### Security
- [ ] No secrets (GitHub PAT, dashboard password, dev-time NVIDIA model keys) in code, logs, or `.env.example`
- [ ] All D1 queries use `?` + `.bind()`, never string interpolation
- [ ] All request bodies validated (type-checked, trimmed, length-limited, enum-checked)
- [ ] URLs validated for scheme (`http`/`https` only) before storage or use
- [ ] New mutation routes respect whatever auth mechanism applies to them

### Testing / Verification
- [ ] Edge cases mentally traced for sync, capture, and validation logic even without automated tests
- [ ] PR description includes manual verification steps for nontrivial changes (build passes, routes return expected status codes), per the `TODO.md` pattern
- [ ] If tests are added, they're independent, specific, and cover edge cases

### Performance
- [ ] No unbounded loops issuing per-iteration D1 queries without reason
- [ ] GitHub API calls use bounded `perPage` values
- [ ] No obviously CPU-heavy synchronous work in a request handler

### Architecture
- [ ] Change matches its claimed roadmap phase; no unflagged scope creep into deferred features
- [ ] `db/schema.sql` and `db/migrations/` stay in sync
- [ ] New cross-cutting logic lives in `src/lib/`, not duplicated in route handlers
- [ ] Wrangler bindings (`wrangler.jsonc`) updated if a new D1 table/binding is introduced

### Documentation
- [ ] `README.md` roadmap/status sections updated if this PR completes or changes tracked work
- [ ] `TODO.md` updated with any newly deferred work
- [ ] New API routes have a file-header comment and a corresponding README status line

## Project Reference

- **Tech Stack**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui-style components
- **Runtime**: Cloudflare Workers via `@opennextjs/cloudflare`
- **Database**: Cloudflare D1 (SQLite), raw `prepare()`/`bind()` — no ORM
- **Auth**: Cloudflare Access, or fallback single-user password + session cookie (partial coverage — verify per-route)
- **GitHub Integration**: GitHub REST API, PAT via `x-github-token` header (dev/testing pattern per README §7)
- **Package manager**: pnpm
- **Deploy**: `pnpm deploy` (OpenNext build → Cloudflare Workers)
- **Local dev**: `pnpm dev` (Next dev server) or `pnpm preview` (full Cloudflare Workers runtime via Wrangler, `localhost:8787`)
- **Testing**: minimal Jest suite (ts-jest + @testing-library/react) — see Testing Standards above
- **Scale/cost target**: $0–1/month infra, single user (per `README.md` §1)
