<!-- verified-against: a7e29e2 | verified: 2026-09-23 -->
# AGENTS.md

How AI agents should work in this repository. Read this before reviewing a PR or writing code.
Detailed, priority-tiered review rules live in
[`.github/instructions/code-review-dev-project-dashboard.instructions.md`](./.github/instructions/code-review-dev-project-dashboard.instructions.md)
— read that file for the full checklist.

---

## Documentation Contract

This repository previously accumulated documents that contradicted the code and each other, which
is worse than having no documents at all: an agent would read a confident, stale claim and act on
it. The rules below exist to prevent that. `pnpm docs:check` enforces the machine-checkable parts.

### Canonical documents

These make claims about the **current** state and must stay true:

| File | Answers |
|---|---|
| [`README.md`](./README.md) | What the app is, how to run it, what is incomplete |
| [`TODO.md`](./TODO.md) | What is open, deferred, or knowingly broken |
| [`AGENTS.md`](./AGENTS.md) | This file — the rules |
| [`DESIGN.md`](./DESIGN.md) | The design system as actually implemented |
| [`AI-DEV-WORKFLOW.md`](./AI-DEV-WORKFLOW.md) | The dev-time AI toolchain |
| [`CHANGELOG.md`](./CHANGELOG.md) | Dated history — **never** a statement about current state |

### Never treat these as specification

- `.git/**` — including `.git/COMMIT_EDITMSG` and `.git/worktrees/**`. These are internals, are
  rewritten by git, and must never be read as project context.
- `docs/**` — the owner's private scratch space. See the section below.
- `.next/**`, `.open-next/**`, `.vercel/**`, `node_modules/**` — build output and dependencies.
- **Any worktree outside this checkout.** Stale worktrees are the single most likely source of
  outdated context: they contain older copies of these very documents. If your working directory is
  not the main checkout, stop and confirm which tree you are in.

### Rules

1. **The code is the source of truth.** If a document disagrees with the code, the code is right and
   the document is a bug. Fix the document in the same change.
2. **Every claim must name something checkable** — a file path, an exported symbol, a line. "The app
   supports tagging" is not acceptable unless you can name the code that does it.
3. **Never cite a README section number.** `README.md` has no numbered sections, so any
   "see README section N" style pointer is always dangling. Cite `file:line` instead.
4. **Ordinal phase numbers are retired above 3.** Numbering drifted until the fourth phase number
   meant three different things at once. Phases 1–3 are closed historical eras; everything after is
   identified by name (see `README.md` → Status). Do not reintroduce ordinal numbering.
5. **Behaviour changes update their documentation in the same commit.** The corresponding line in
   `README.md` / `TODO.md` / `DESIGN.md` is part of the change, not a follow-up.
6. **A canonical doc must carry a `<!-- verified-against: <sha> | verified: <date> -->` stamp** that
   resolves to a real commit.
7. **`pnpm docs:check` must pass.** It runs in CI. If a check blocks you, fix the drift or add an
   explicit, reasoned entry to the script's allowlist — never weaken the check.
8. **Touching `src/` or `db/` makes every state doc stale.** `docs:check` fails when a state doc is
   older than the newest commit to those trees. Re-read this list and refresh the `verified-against`
   stamp even if no prose needed to change — that acknowledgement is the point, because it forces
   the claims to be re-checked on every behaviour change.

---

## Repository Context

- **Single-user, self-hosted.** There is no multi-tenant data isolation to check. The security
  boundary that matters is public-internet-vs-authenticated, not user-vs-user.
- **Runtime is Cloudflare Workers** via OpenNext, not Node. Flag Node-only APIs not covered by the
  `nodejs_compat` flag, and flag long-running or blocking work in request handlers — Workers have CPU
  and subrequest limits, and there is no persistent background process.
- **Database is Cloudflare D1** (SQLite), accessed with raw `prepare()`/`bind()` — there is no ORM.
  There is no service layer either: pages and route handlers both issue SQL directly against the
  helper in `src/lib/db.ts`.
- **A minimal Jest suite exists** (ts-jest + @testing-library/react). Do not
  treat test coverage as a blocking condition, but reason through edge cases explicitly.
- **Auth is Cloudflare Access.** There is no application password or session cookie — if you find
  documentation claiming one exists, that documentation is stale. `requireAuth()` accepts only the
  `Cf-Access-User-Email` header, plus an explicit `DEV_AUTH_BYPASS=true` opt-in that lives in the
  never-deployed `.dev.vars`. Never make the bypass implicit again (for example by keying it off
  `NODE_ENV`); it must fail closed when the Cloudflare context is unavailable.

---

## Code Style & Anti-Patterns

- **Database access:** Every D1 query must use `?` placeholders with `.bind()`. Flag any string
  interpolation of request data into a query as critical.
- **Validation:** New API routes validate request bodies by hand (`typeof` checks, trimming,
  explicit length limits, `Set`-based allowlists for enum-like fields) to match the pattern in
  `src/app/api/projects/route.ts` and `src/app/api/capture/route.ts`. Wrap `req.json()` in
  `try/catch`.
- **Response shape:** API routes return `{ error }` on failure and `{ ok: true, ... }` (or a direct
  resource payload) on success, with appropriate HTTP status codes.
- **Secrets:** the app reads Worker env via the Cloudflare context: `GITHUB_TOKEN` (GitHub sync) and
  `CF_API_TOKEN` (deploy sync, `src/app/api/sync/deploys/route.ts`), each paired with the
  non-secret `CF_ACCOUNT_ID` / `CF_SCRIPT_NAME` vars in `wrangler.jsonc`. Only `GITHUB_TOKEN`
  belongs in `.env.example` — the Cloudflare secret is set via `wrangler secret put` and mirrored
  locally in `.dev.vars` (gitignored), so never commit a real value. Never add a variable the code
  does not read. `scripts/docs-check.mjs` enforces both.
- **Schema changes:** Any edit to `db/schema.sql` must have a matching, numbered file in
  `db/migrations/`, and the two must not diverge. `scripts/docs-check.mjs` verifies every migrated
  column appears in the schema.
- **Project slugs are permalinks:** `projects.slug` is assigned once at creation and must never be
  rewritten on rename, or every existing link breaks. `uniqueProjectSlug()` in
  `src/lib/projects.ts` resolves collisions at create time; do not add `slug` back to the PATCH
  update in `src/app/api/projects/[id]/route.ts`.
- **Edge runtime on API routes:** `export const runtime = 'edge'` is not supported by OpenNext
  Cloudflare for `app/api/` routes. Flag any new route that adds it.
- **Auth on mutation routes:** Every `POST`/`PATCH`/`DELETE` API handler must call `requireAuth()`
  from `src/lib/auth.ts` at the top and return its 401 response early. There are currently **no
  exceptions** — the exemption allowlist in `scripts/docs-check.mjs` is empty, and the check fails
  if any route appears without a check or an explicit, reasoned declaration. Never add an entry
  without a stated reason, and remove it the moment the exception closes.
- **Client/server boundary:** Flag unnecessary `"use client"` directives, and flag any server-only
  logic (DB access, secrets) reachable from a client component.

---

## Code Review

Your primary goal when reviewing a pull request is to validate that changes are secure, fit the
Workers/D1 runtime this app actually runs on, and match the conventions already established here —
not generic best practices for a different kind of app. Apply the 🔴 CRITICAL / 🟡 IMPORTANT /
🟢 SUGGESTION tiers from the instructions file to every comment.

Check that a PR's scope matches the workstream it claims to belong to (see `README.md` → Status)
before approving scope expansion into deferred work.

Note: `.github/instructions/code-review-dev-project-dashboard.instructions.md` declares
`excludeAgent: ["coding-agent"]`, so GitHub Copilot loads it automatically but coding agents do
not. If you are a coding agent, read it explicitly before reviewing — it is not injected for you.

---

## `docs/` directory — owner's private scratch space

- `docs/` (and any subfolders) is the owner's personal organizing space: ad-hoc plans, scratch
  ideas, informal notes.
- Do **not** treat anything in `docs/` as canonical project spec or source of truth.
- Do **not** write into `docs/` unless the owner explicitly directs it.
- If you find something in `docs/` that appears to contradict the code, the code wins — and the
  finding belongs in `TODO.md`, not in `docs/`.

---

## What Not to Flag

- Missing automated test coverage (a minimal Jest suite exists — see Repository Context).
- Lack of multi-tenant authorization checks (this is single-user by design).
- Missing abstraction layers, heavyweight config, or enterprise-scale tooling that does not fit a
  $0–1/month solo project.
