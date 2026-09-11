# AGENTS.md

## Code Review

Your primary goal when reviewing a pull request in this repository is to
validate that changes are secure, fit the Cloudflare Workers/D1 runtime this
app actually runs on, and match the conventions already established in the
codebase — not generic best practices for a different kind of app.

Before reviewing, read
`.github/instructions/code-review-dev-project-dashboard.instructions.md` and
apply its priority tiers (🔴 CRITICAL / 🟡 IMPORTANT / 🟢 SUGGESTION)
to every comment you leave.

### Repository Context

- Single-user, self-hosted project. There is no multi-tenant data isolation
  to check — the security boundary that matters is public-internet-vs-
  authenticated, not user-vs-user.
- Runtime is Cloudflare Workers via OpenNext, not Node. Database is
  Cloudflare D1 (SQLite) accessed with raw `prepare()`/`bind()` — there is no
  ORM.
- There is a minimal Jest suite (ts-jest + @testing-library/react) covering a
  couple of components; do not treat test coverage as a blocking condition.
  Reason through edge cases explicitly in your review regardless.
- The project moves through numbered phases tracked in `README.md` and
  `TODO.md`. Check that a PR's scope matches its claimed phase before
  approving scope expansion into features marked "out of MVP."
- The project now has `postcss.config.mjs` — Tailwind compiles correctly.
- `pnpm preview` is the production-parity command. It previously failed due
  to `export const runtime = 'edge'` on API routes (tracked in TODO.md #5);
  that issue is resolved.

### `docs/` directory — owner's private notes area

- `docs/` (and its `plans/` and `reviews/` subfolders) is the owner's personal
  / organizing space: ad-hoc plans, scratch ideas, and informal code reviews.
- Do **not** treat `docs/` content as canonical project spec or source of
  truth. The repo-root files `README.md`, `TODO.md`, and `AGENTS.md` are the
  canonical living status docs.
- Do **not** write into `docs/` unless the owner explicitly directs it.
- Exception: `HANDOFF.md` at the repo root (not inside `docs/`) exists by
  design to transfer context between AI sessions. Even so, prefer
  `TODO.md` / `README.md` / `AGENTS.md` as the canonical status docs.

### Code Style & Anti-Patterns

Enforce these strict patterns for code inspection:

- **Database access:** Every D1 query must use `?` placeholders with
  `.bind()`. Flag any string interpolation of request data into a query as
  critical.
- **Validation:** New API routes must validate request bodies by hand
  (`typeof` checks, trimming, explicit length limits, `Set`-based allowlists
  for enum-like fields) to match the pattern already used in
  `src/app/api/projects/route.ts` and `src/app/api/capture/route.ts`.
- **Response shape:** API routes must return `{ error }` on failure and
  `{ ok: true, ... }` (or a direct resource payload) on success, with
  appropriate HTTP status codes.
- **Secrets:** `GITHUB_PAT`, `DASHBOARD_PASSWORD`, and any development-only AI
  model API keys must never appear in `.env.example`, client-bundle code, or
  a runtime route under `src/app/**`.
- **Schema changes:** Any edit to `db/schema.sql` must have a matching,
  numbered file in `db/migrations/`.
- **Edge runtime on API routes:** `export const runtime = 'edge';` is not
  supported by OpenNext Cloudflare for `app/api/` routes. Remove it and use
  the standard Workers runtime. Flag any new route that adds it.
- **Auth on mutation routes:** Every `POST`/`PATCH`/`DELETE` API handler must
  call `requireAuth()` from `src/lib/auth.ts` at the top and return its 401
  response early. Flag any new mutation route that omits it. This is the
  public-internet-vs-authenticated boundary, not multi-tenant isolation.
- **Client/server boundary:** Flag unnecessary `"use client"` directives, and
  flag any server-only logic (DB access, secrets) reachable from a client
  component.

### What Not to Flag

- Missing automated test coverage (a minimal Jest suite exists — see Repository Context)
- Lack of multi-tenant authorization checks (this is single-user by design)
- Missing abstraction layers, heavyweight config, or enterprise-scale
  tooling that doesn't fit a $0–1/month solo project
