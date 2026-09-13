# TODO — Known Issues & Deferred Work

Running log of issues intentionally deferred during setup, build, and deployment. Check this before starting new work so nothing gets silently forgotten.

## Milestones

### Phase 3 — Quick capture
- **Status:** Complete — 2026-07-29
- Added a manual/bookmarklet capture form with URL and title prefill, project assignment, notes, duplicate detection, and success/error states.
- Added bookmarklet installation UI under Settings and dashboard navigation links.
- Hardened `POST /api/capture` with URL, field-length, saved-via, and active-project validation.

### Phase 4 — GitHub Sync as a Real Feature
- **Status:** Complete — 2026-09-12
- Auth-guarded `POST` and `GET` in `/api/sync/github`.
- Added `github_repo` support and URL normalization in `ProjectDialog` and project API routes.
- Added `repo_metadata` column to `projects` (`db/migrations/0003_add_repo_metadata.sql`) and populated repo activity and metadata during sync.
- Retired dead-code `REPO_TO_PROJECT` mapping in `src/lib/github.ts`.
- Rendered `repo_metadata` on project cards and project detail header.

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
- **Status:** Resolved — 2026-09-12
- **Details:**
  - ✅ Resolved (commits `12f5013` + `d0cae7f`): 🔴 CRITICAL SQL-injection-via-template-literal in `projects/[id]/route.ts` and `resources/[id]/route.ts`.
  - ✅ Resolved (commit `d0cae7f`): 🟡 `as any` body parsing without `try/catch` + unbounded field lengths across mutation routes.
  - ✅ Resolved (Phase 4): 🟢 Retired dead-code `REPO_TO_PROJECT` mapping in `src/lib/github.ts` in favor of DB `github_repo` matching.

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
- **Details:** Added `src/lib/auth.ts` with `requireAuth(request)` (Cloudflare Access `Cf-Access-User-Email` header, with a local-dev bypass when `NODE_ENV !== 'production'`), and wired it into all existing mutation handlers.

### 8. Jest configuration broken
- **Status:** Complete — 2026-09-10
- **Details:** Switched `jest.config.cjs` from `babel-jest` to `ts-jest` with `jsx: 'react-jsx'`.

---

## How to use this file
- Add a new numbered entry any time a fix is consciously deferred during setup, build, deployment, or feature work.
- Include: status, date logged, details, why deferred, and what "fix later" looks like.
- When resolved, move the entry to the Resolved section with the resolution date and a short summary of the fix.
- Keep related infrastructure issues grouped when they point to the same eventual migration path.
