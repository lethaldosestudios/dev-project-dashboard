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

### 1. Wrangler pinned to v3.x — needs migration to OpenNext adapter
- **Status:** Deferred
- **Date logged:** 2026-07-24
- **Details:** `@cloudflare/next-on-pages` requires `wrangler@^3.28.2` and is not compatible with Wrangler 4. Wrangler was pinned to `3.72.0` to unblock local setup and build work.
- **Why deferred:** Fixing this properly means migrating off `@cloudflare/next-on-pages` to the OpenNext Cloudflare adapter, which will touch `package.json`, deployment workflow, and the current Cloudflare binding access pattern.
- **Fix later:** Migrate to `@opennextjs/cloudflare`, then upgrade Wrangler to a supported 4.x-compatible setup.

### 2. Next.js patched to 14.2.35 — still on EOL major version
- **Status:** Patched for known CVEs, not resolved long-term
- **Date logged:** 2026-07-24
- **Details:** Next.js is currently pinned to `14.2.35`, which closed known security issues, but Next.js 14 is still an end-of-life major version and will not receive ongoing support.
- **Why deferred:** Upgrading to a newer major should happen after Phase 1–3 stabilize, because it may affect App Router behavior, route handlers, and the eventual Cloudflare adapter migration.
- **Fix later:** Plan a Next.js 15/16 upgrade during a dedicated compatibility pass after the deployment path is stabilized.

### 3. `@cloudflare/next-on-pages` is deprecated upstream
- **Status:** Deferred, tracked alongside #1
- **Date logged:** 2026-07-24
- **Details:** `@cloudflare/next-on-pages` is deprecated, and Cloudflare's current guidance points developers to the OpenNext adapter for deploying Next.js apps on Cloudflare.

## Deferred Work Log

Record future issues here with status, date, details, why they were deferred, and the eventual fix or decision.
