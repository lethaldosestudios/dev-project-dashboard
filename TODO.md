# TODO  Known Issues & Deferred Work

Running log of issues intentionally deferred during setup, build, and deployment. Check this before starting new work so nothing gets silently forgotten.

## Open Issues

### 2. Next.js patched to 14.2.35  still on EOL major version
- **Status:** **Resolved** 
- **Date logged:** 2026-07-24
- **Date resolved:** 2026-07-28
- **Details:** Next.js is currently pinned to `14.2.35`, which closed known security issues, but Next.js 14 is still an end-of-life major version and will not receive ongoing support.
- **Why deferred:** Upgrading to a newer major should happen after Phase 13 stabilize, because it may affect App Router behavior, route handlers, and the eventual Cloudflare adapter migration.
- **Resolution:** Upgraded to Next.js 16.2.11 as part of OpenNext migration (PR #1).

## Resolved

### 1. Wrangler pinned to v3.x  needs migration to OpenNext adapter
- **Status:** Resolved
- **Date logged:** 2026-07-24
- **Date resolved:** 2026-07-28
- **Details:** `@cloudflare/next-on-pages` requires `wrangler@^3.28.2` and is not compatible with Wrangler 4. Wrangler was pinned to `3.72.0` to unblock local setup and build work.
- **Why deferred:** Fixing this properly means migrating off `@cloudflare/next-on-pages` to the OpenNext Cloudflare adapter, which will touch `package.json`, deployment workflow, and the current Cloudflare binding access pattern.
- **Resolution:** Migrated to `@opennextjs/cloudflare` with Wrangler 4.114.0, upgraded Next.js to 16.2.11 (PR #1). [web:14][web:83]

### 3. `@cloudflare/next-on-pages` is deprecated upstream
- **Status:** Resolved
- **Date logged:** 2026-07-24
- **Date resolved:** 2026-07-28
- **Details:** `@cloudflare/next-on-pages` is deprecated, and Cloudflares current guidance points developers to the OpenNext adapter for deploying Next.js apps on Cloudflare. [web:14][web:63][web:80]
- **Why deferred:** The current repo was already scaffolded around `next-on-pages`, D1 bindings, and Pages-style build scripts, so swapping adapters mid-setup would have expanded scope too early.
- **Resolution:** Replaced with `@opennextjs/cloudflare` adapter (PR #1). [web:62][web:76][web:83]

### 4. `@cloudflare/next-on-pages` build fails on `async_hooks`
- **Status:** Resolved
- **Date logged:** 2026-07-26
- **Date resolved:** 2026-07-28
- **Details:** `next build` now completes successfully, and the remaining non-static routes were updated with `export const runtime = 'edge'` to satisfy the Pages adapter. The current failure happens later, inside the `@cloudflare/next-on-pages` bundling step, with `Could not resolve "async_hooks"`, which points to adapter/runtime incompatibility rather than app feature code. [web:24][web:39][web:75]
- **Why deferred:** This is no longer a normal app-code fix. It is tied to the deprecated Pages adapter path, which Cloudflare no longer recommends as the long-term deployment target for Next.js. [web:14][web:76][web:80]
- **Resolution:** Resolved as part of OpenNext migration - removed Pages-specific `runtime = 'edge'` exports, updated build/deploy scripts, validated build on Workers-based path (PR #1). [web:64][web:83]

---

## How to use this file
- Add a new numbered entry any time a fix is consciously deferred during setup, build, deployment, or feature work.
- Include: status, date logged, details, why deferred, and what fix later looks like.
- When resolved, move the entry to the Resolved section with the resolution date and a short summary of the fix.
- Keep related infrastructure issues grouped when they point to the same eventual migration path.
