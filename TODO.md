# TODO — Known Issues & Deferred Work

Running log of issues intentionally deferred during setup, build, and deployment. Check this before starting new work so nothing gets silently forgotten.

## Milestones

### Phase 3 — Quick capture
- **Status:** Complete — 2026-07-29
- Added a manual/bookmarklet capture form with URL and title prefill, project assignment, notes, duplicate detection, and success/error states.
- Added bookmarklet installation UI under Settings and dashboard navigation links.
- Hardened `POST /api/capture` with URL, field-length, saved-via, and active-project validation.

### Phase 4 — AI-assisted development and visual/design review
- **Status:** Next
- Use `docs/plans/2026-07-29-ai-assisted-development-workflow.md`.
- DeepSeek handles primary implementation and debugging.
- Kimi handles visual design critique and screenshot review.
- Nemotron handles architecture, planning, verification, and test strategy.
- These models are development tools only. The dashboard must not require NVIDIA credentials or runtime model routes.

### Copilot code review instructions
- **Status:** Complete — 2026-07-30
- Added `AGENTS.md` (repo root), `.github/copilot-instructions.md`, and `.github/instructions/code-review-dev-project-dashboard.instructions.md` to tailor GitHub Copilot's code review agent to this repo's actual stack and constraints (Next.js 15 App Router, Cloudflare Workers via OpenNext, D1 with raw `prepare`/`bind`, single-user/no multi-tenant auth, no automated test suite, phased roadmap).
- **Verification:** Reviewed via the introducing PR on the `add-copilot-instructions` branch, since Copilot reads instruction files from the head branch.
- **Follow-up:** Open a small test PR with an intentional issue (e.g. a string-interpolated D1 query or a hardcoded secret) to confirm the 🔴 CRITICAL tier fires as expected, and iterate on wording if Copilot misses or misapplies instructions.

## Open Issues

### 1. OpenNext migration
- **Status:** Complete — 2026-07-29
- **Details:** Replaced the deprecated `@cloudflare/next-on-pages` adapter with `@opennextjs/cloudflare`, upgraded Next.js to 15.5.21 and Wrangler to 4.115.0, moved the Worker entrypoint to `.open-next/worker.js`, and updated D1 access for OpenNext.
- **Verification:** TypeScript, `next build`, OpenNext build, and local Cloudflare preview all pass. `/`, `/capture`, and `/api/projects` returned HTTP 200.

### 2. Next.js 15 compatibility
- **Status:** Complete — 2026-07-29
- **Details:** Dynamic route params now use the Next 15 promise form. The app remains single-user and keeps its existing App Router behavior.

### 3. Local D1 initialization
- **Status:** Documented and verified
- **Details:** The local database must be initialized with `pnpm dlx wrangler d1 execute dev-project-dashboard-db --local --file=./db/schema.sql` before opening D1-backed pages.

### 5. `pnpm preview` fails — Edge runtime on API routes
- **Status:** Open — 2026-09-10
- **Details:** `src/app/api/sync/deploys/route.ts` and `src/app/projects/[slug]/page.tsx` exported `export const runtime = 'edge';`. OpenNext Cloudflare requires edge runtime functions to be defined separately (via middleware or a separate Worker entry), not co-located in `app/api/`. `pnpm preview` failed with a "cannot use the edge runtime" error.
- **Fix:** Remove `export const runtime = 'edge';` from both files. Standard Workers runtime is sufficient.

### 6. Missing `github_repo` column in DB schema
- **Status:** Open — 2026-08-31 (from review)
- **Details:** `src/app/api/sync/github/route.ts` queries `WHERE github_repo = ?` but `db/schema.sql` and `db/migrations/0001_init.sql` lacked this column.
- **Fix:** Add `github_repo TEXT` to the `projects` table in `db/schema.sql`; create `db/migrations/0002_add_github_repo.sql`.

### 9. Notes edit/delete capability is missing (feature gap)
- **Status:** Open — 2026-09-11
- **Details:** Notes can be created (`POST /api/notes`) but never edited or deleted individually. There is no `src/app/api/notes/[id]/route.ts` (PATCH/DELETE) and no corresponding UI/client code in `src/components/notes-editor.tsx`. Notes are only removed indirectly via cascade when a project is deleted.
- **Why deferred:** Out of scope for the auth work (TODO #7); no current UI or need. A single-user app can manage via recreating notes, but full CRUD parity with projects/resources would be good eventually.
- **Fix:** Add `notes/[id]/route.ts` with PATCH/DELETE (auth-protected), plus edit/delete controls in the notes editor.

## Resolved

### 7. Unauthenticated mutation API routes
- **Status:** Complete — 2026-09-11
- **Details:** Added `src/lib/auth.ts` with `requireAuth(request)` (Cloudflare Access `Cf-Access-User-Email` header, with a local-dev bypass when `NODE_ENV !== 'production'`), and wired it into all existing mutation handlers: `POST /api/projects`, `PATCH`/`DELETE /api/projects/[id]`, `POST /api/resources`, `PATCH`/`DELETE /api/resources/[id]`, and `POST /api/notes`.
- **Verification:** `pnpm build` passes; `pnpm test` passes (2/2 suites). Note: there is no `notes/[id]` route in this codebase (tracked separately as Issue #9), so the 5 existing mutation routes represent the complete security boundary.

### 4. Missing PostCSS config — Tailwind not compiling
- **Status:** Complete — 2026-09-10
- **Details:** `postcss.config.mjs` now exists and Tailwind compiles correctly.

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
