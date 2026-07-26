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

### 4. Missing PostCSS config — Tailwind not compiling
- **Status:** Open — 2026-08-06
- **Details:** No `postcss.config.mjs`/`.js`/`.cjs` exists in the repo, despite `tailwindcss` and `postcss` being installed and `globals.css` containing valid `@tailwind` directives. Result: Tailwind never runs, and the app renders as unstyled HTML.
- **Fix:** Add `postcss.config.mjs` with `tailwindcss` and `autoprefixer` plugins; confirm `autoprefixer` is a dependency.

## Deferred Work Log

_(Move items here once fixed, with the resolution date and a one-line summary of what changed.)_

---

## How to use this file
- Add a new numbered entry any time a fix is consciously deferred during setup, build, deployment, or feature work.
- Include: status, date logged, details, why deferred, and what "fix later" looks like.
- When resolved, move the entry to the Resolved section with the resolution date and a short summary of the fix.
- Keep related infrastructure issues grouped when they point to the same eventual migration path.
