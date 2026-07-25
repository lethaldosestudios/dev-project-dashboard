# TODO — Known Issues & Deferred Work

Running log of things intentionally deferred during setup/build. Check this before starting new work so nothing gets silently forgotten.

## Open Issues

### 1. Wrangler pinned to v3.x — needs migration to OpenNext adapter
- **Status:** Deferred
- **Date logged:** 2026-07-24
- **Details:** `@cloudflare/next-on-pages` (used for D1 bindings in API routes) requires `wrangler@^3.28.2` and is not compatible with Wrangler 4. Rolled Wrangler back to `3.72.0` to unblock local dev.
- **Why deferred:** Fixing this properly means migrating off `@cloudflare/next-on-pages` to the OpenNext Cloudflare adapter (https://opennext.js.org/cloudflare), which touches `src/lib/db.ts` (the `getDb()` binding pattern) and the build/deploy scripts in `package.json`. Too large to do mid-setup.
- **Fix later:** Migrate to OpenNext adapter, then upgrade Wrangler to 4.x cleanly.

### 2. Next.js patched to 14.2.35 — still on EOL major version
- **Status:** Patched for known CVEs, not resolved long-term
- **Date logged:** 2026-07-24
- **Details:** Next.js 14 reached end-of-life October 26, 2025. Applied the final security patch (14.2.35, Dec 11 2025) to close known CVEs (CVE-2025-66478 and related), but the major version itself no longer receives support.
- **Fix later:** Plan a Next.js 15/16 upgrade once Phase 1–3 are stable. Will likely require App Router compatibility checks.

### 3. `@cloudflare/next-on-pages` is deprecated upstream
- **Status:** Deferred, tracked alongside #1
- **Date logged:** 2026-07-24
- **Details:** Cloudflare's own deprecation notice recommends the OpenNext adapter as the maintained path forward.
- **Fix later:** Same fix as #1 — resolve together in one migration pass.

## Resolved

_(move items here once fixed, with the date and what was done)_

---

## How to use this file
- Add a new numbered entry any time we consciously defer a fix during setup or a build session.
- Include: status, date logged, details, why deferred, and what "fix later" looks like.
- When resolved, move the entry to the Resolved section with the resolution date and a one-line summary of the fix.
