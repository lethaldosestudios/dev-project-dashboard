# TODO — Known Issues & Deferred Work

Running log of issues intentionally deferred during setup, build, and deployment. Check this before starting new work so nothing gets silently forgotten.

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
- **Details:** `@cloudflare/next-on-pages` is deprecated, and Cloudflare’s current guidance points developers to the OpenNext adapter for deploying Next.js apps on Cloudflare.
- **Why deferred:** The current repo was already scaffolded around `next-on-pages`, D1 bindings, and Pages-style build scripts, so swapping adapters mid-setup would have expanded scope too early.
- **Fix later:** Resolve together with #1 in one migration pass to OpenNext on Cloudflare Workers.

### 4. `@cloudflare/next-on-pages` build fails on `async_hooks`
- **Status:** Deferred, tracked alongside #1 and #3
- **Date logged:** 2026-07-26
- **Details:** `next build` now completes successfully, and the remaining non-static routes were updated with `export const runtime = 'edge'` to satisfy the Pages adapter. The current failure happens later, inside the `@cloudflare/next-on-pages` bundling step, with `Could not resolve "async_hooks"`, which points to adapter/runtime incompatibility rather than app feature code.
- **Why deferred:** This is no longer a normal app-code fix. It is tied to the deprecated Pages adapter path, which Cloudflare no longer recommends as the long-term deployment target for Next.js.
- **Fix later:** Resolve as part of the OpenNext migration. During that pass, remove Pages-specific `runtime = 'edge'` exports where no longer appropriate, update build/deploy scripts, and validate local preview/deploy on the Workers-based path.

## Resolved

_(Move items here once fixed, with the resolution date and a one-line summary of what changed.)_

---

## How to use this file
- Add a new numbered entry any time a fix is consciously deferred during setup, build, deployment, or feature work.
- Include: status, date logged, details, why deferred, and what “fix later” looks like.
- When resolved, move the entry to the Resolved section with the resolution date and a short summary of the fix.
- Keep related infrastructure issues grouped when they point to the same eventual migration path.
