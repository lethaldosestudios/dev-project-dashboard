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

## Deferred Work Log

Record future issues here with status, date, details, why they were deferred, and the eventual fix or decision.
