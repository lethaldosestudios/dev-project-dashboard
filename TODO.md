# TODO — Known Issues & Deferred Work

Running log of issues intentionally deferred during setup, build, and deployment. Check this before starting new work so nothing gets silently forgotten.

## Milestones

### Phase 3 — Quick capture
- **Status:** Complete — 2026-07-29
- Added a manual/bookmarklet capture form with URL and title prefill, project assignment, notes, duplicate detection, and success/error states.
- Added bookmarklet installation UI under Settings and dashboard navigation links.
- Hardened `POST /api/capture` with URL, field-length, saved-via, and active-project validation.

### Phase 4 — Polish & Iterate
- **Status:** Next
- Visual and functional refinements plus additions surfaced during real use. No committed scope yet — to be planned as concrete items.

### Phase 5 — Optional AI features
- **Status:** Deferred (possible future direction)
- Product-facing AI capabilities are *not* committed work. This is separate from the AI-assisted *development* workflow (see `AI-DEV-WORKFLOW.md`), which is a dev-time aid only and never ships into the app.

### Copilot code review instructions
- **Status:** Complete — 2026-07-30
- Added `AGENTS.md` (repo root), `.github/copilot-instructions.md`, and `.github/instructions/code-review-dev-project-dashboard.instructions.md` to tailor GitHub Copilot's code review agent to this repo's actual stack and constraints (Next.js 15 App Router, Cloudflare Workers via OpenNext, D1 with raw `prepare`/`bind`, single-user/no multi-tenant auth, no automated test suite, phased roadmap).
- **Verification:** Reviewed via the introducing PR on the `add-copilot-instructions` branch, since Copilot reads instruction files from the head branch.
- **Follow-up:** Open a small test PR with an intentional issue (e.g. a string-interpolated D1 query or a hardcoded secret) to confirm the 🔴 CRITICAL tier fires as expected, and iterate on wording if Copilot misses or misapplies instructions.

## Open Issues

### 9. Notes edit/delete capability is missing (feature gap)
- **Status:** Open — 2026-09-11
- **Details:** Notes can be created (`POST /api/notes`) but never edited or deleted individually. There is no `src/app/api/notes/[id]/route.ts` (PATCH/DELETE) and no corresponding UI/client code in `src/components/notes-editor.tsx`. Notes are only removed indirectly via cascade when a project is deleted.
- **Why deferred:** Out of scope for the auth work (TODO #7); no current UI or need. A single-user app can manage via recreating notes, but full CRUD parity with projects/resources would be good eventually.
- **Fix:** Add `notes/[id]/route.ts` with PATCH/DELETE (auth-protected), plus edit/delete controls in the notes editor.

### 10. Unresolved findings from `archives/codebase-review.md` (2026-08-31)
- **Status:** Open — 2026-09-11
- **Details:** The 2026-08-31 codebase review flagged several items. Most are since resolved (edge runtime #5, Jest config #8, `github_repo` schema #6, auth #7, PostCSS #4). The following remain open:
  - 🔴 CRITICAL: SQL injection via template-literal column construction — `src/app/api/projects/[id]/route.ts` (line 58) and `src/app/api/resources/[id]/route.ts` (line 33) build `UPDATE ... SET ${updates.join(", ")}` dynamically. Column names are allowlisted today, but this breaks the parameterized-query guarantee and could open injection vectors if keys change.
  - 🟡 IMPORTANT: `as any` body parsing without `try/catch`, plus unbounded field lengths — `projects/route.ts`, `resources/route.ts`, `notes/route.ts`, `projects/[id]/route.ts` (the `POST /api/capture` pattern is not yet applied everywhere).
  - 🟢 SUGGESTION: hardcoded `REPO_TO_PROJECT` mapping in `src/lib/github.ts` should migrate to DB-backed project settings.
  - 🟢 SUGGESTION: replace `as any` on route params / D1 results with typed shapes from `src/types/index.ts`.
- **Why deferred:** Noted here for tracking; deliberately left out of the docs decoupling task. No active bug reports, but the critical query-construction item should be addressed before any new dynamic-column work.
- **Fix:** Convert `${updates.join(", ")}` to explicit column-by-column updates (matching `AGENTS.md` parameterized-query mandate); apply the `capture/route.ts` validation pattern to the other mutation routes; migrate `REPO_TO_PROJECT` to DB settings.

## Resolved

### 1. OpenNext migration
- **Status:** Complete — 2026-07-29
- **Details:** Replaced the deprecated `@cloudflare/next-on-pages` adapter with `@opennextjs/cloudflare`, upgraded Next.js to 15.5.21 and Wrangler to 4.115.0, moved the Worker entrypoint to `.open-next/worker.js`, and updated D1 access for OpenNext.
- **Verification:** TypeScript, `next build`, OpenNext build, and local Cloudflare preview all pass. `/`, `/capture`, and `/api/projects` returned HTTP 200.

### 2. Next.js 15 compatibility
- **Status:** Complete — 2026-07-29
- **Details:** Dynamic route params now use the Next 15 promise form. The app remains single-user and keeps its existing App Router behavior.

### 3. Local D1 initialization (documented)
- **Status:** Complete — 2026-07-29
- **Details:** Local DB must be initialized before opening D1-backed pages. Command: `pnpm dlx wrangler d1 execute dev-project-dashboard-db --local --file=./db/schema.sql`.

### 4. Missing PostCSS config — Tailwind not compiling
- **Status:** Complete — 2026-09-10
- **Details:** `postcss.config.mjs` now exists and Tailwind compiles correctly.

### 5. `pnpm preview` fails — Edge runtime on API routes
- **Status:** Complete — 2026-09-10
- **Details:** Removed `export const runtime = 'edge';` from `src/app/api/sync/deploys/route.ts` and `src/app/projects/[slug]/page.tsx`. Standard Workers runtime is sufficient.

### 6. Missing `github_repo` column in DB schema
- **Status:** Complete — 2026-09-10
- **Details:** Added `github_repo TEXT` to the `projects` table in `db/schema.sql`; created `db/migrations/0002_add_github_repo.sql`.

### 7. Unauthenticated mutation API routes
- **Status:** Complete — 2026-09-11
- **Details:** Added `src/lib/auth.ts` with `requireAuth(request)` (Cloudflare Access `Cf-Access-User-Email` header, with a local-dev bypass when `NODE_ENV !== 'production'`), and wired it into all existing mutation handlers: `POST /api/projects`, `PATCH`/`DELETE /api/projects/[id]`, `POST /api/resources`, `PATCH`/`DELETE /api/resources/[id]`, and `POST /api/notes`.
- **Verification:** `pnpm build` passes; `pnpm test` passes (2/2 suites). Note: there is no `notes/[id]` route in this codebase (tracked separately as Issue #9), so the 5 existing mutation routes represent the complete security boundary.

### 8. Jest configuration broken
- **Status:** Complete — 2026-09-10
- **Details:** Switched `jest.config.cjs` from `babel-jest` to `ts-jest` with `jsx: 'react-jsx'` (the root `tsconfig.json` uses `jsx: "preserve"`, which left JSX untransformed and caused `SyntaxError`). Also added `modulePathIgnorePatterns` for `.next/` and `.open-next/` to silence haste-map naming collisions.
- **Verification:** `pnpm test` passes — 2 test suites (`project-card.test.tsx`, `header.test.tsx`) run cleanly with no `SyntaxError`.

## Deferred Work Log

_(Move items here once fixed, with the resolution date and a one-line summary of what changed.)_

---

## How to use this file
- Add a new numbered entry any time a fix is consciously deferred during setup, build, deployment, or feature work.
- Include: status, date logged, details, why deferred, and what "fix later" looks like.
- When resolved, move the entry to the Resolved section with the resolution date and a short summary of the fix.
- Keep related infrastructure issues grouped when they point to the same eventual migration path.
