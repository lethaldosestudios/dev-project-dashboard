<!-- verified-against: b5396e5bbd2ca0b8b166b122ef9f9af8ad429e38 | verified: 2026-09-16 -->
# Changelog

**This file is a historical record only.** It describes what changed and when. It is
**never** a statement about the current state of the code — for that, read the code, or
`README.md` (what the app is / how to run it) and `TODO.md` (what is still open).

It replaced the `archives/` and `reports/` directories, which accumulated retrospective
documents that contradicted the code and each other. Git history remains the authoritative
archive; this file is the readable summary.

Entries are newest-first, one line per meaningful change, dated by commit.

---

## 2026-09-16
- Guarded `POST /api/capture` with `requireAuth()` and deleted the no-op `POST /api/sync/deploys`
  route, which returned `ok: true` while performing no work. The `docs:check` auth exemption
  allowlist is now empty, so the `requireAuth` rule is unconditionally enforced.
- Replaced the implicit `NODE_ENV`-based auth bypass with an explicit `DEV_AUTH_BYPASS=true` opt-in
  read from `.dev.vars`. The `Cf-Access-User-Email` header is now checked first, and `requireAuth()`
  fails closed when the Cloudflare context is unavailable. Added `src/lib/auth.test.ts` (6 cases).
- Pinned `NODE_ENV=test` in `jest.config.cjs`. Jest honours an explicitly set `NODE_ENV`, so a
  shell exporting `NODE_ENV=production` made React resolve to its production build and failed every
  suite with "act(...) is not supported in production builds of React".
- Fixed the project-detail status pill: replaced runtime-built Tailwind class strings
  (`bg-${...}/20`) with an explicit status → class mapping so Tailwind can generate the
  styles. Recovered from the `lethaldosestudios-review-recent-changes` branch.

## 2026-09-14
- `github_repo` is now validated and normalized to canonical `owner/repo` on both
  `POST /api/projects` and `PATCH /api/projects/[id]`; malformed values return 400.

## 2026-09-13
- Delivered GitHub sync as a real feature: repos can be linked to projects via
  `projects.github_repo`, sync writes `github_activity`, updates `last_activity_at`, and
  stores display metadata in `projects.repo_metadata` (`db/migrations/0003_add_repo_metadata.sql`).
- Retired the dead hardcoded `REPO_TO_PROJECT` mapping and `getProjectIdForRepo()` from
  `src/lib/github.ts`; DB lookup is now the only matching path.

## 2026-09-12
- Replaced dynamic `SET`-clause SQL construction with explicit column-by-column updates in
  `projects/[id]` and `resources/[id]` — closes the template-literal SQL-injection finding.
- Hardened request-body validation across the remaining mutation routes: `try/catch` around
  `req.json()` plus explicit length limits.
- Marked resolved review findings; stopped tracking `tsbuildinfo` artifacts.

## 2026-09-11
- Added `src/lib/auth.ts` with `requireAuth()` and protected the project, resource, and note
  mutation routes with Cloudflare Access (`Cf-Access-User-Email`).
- Documentation consolidation: rewrote `README.md`, reorganized `TODO.md`, added a `docs/`
  guardrail to `AGENTS.md`, moved the AI dev-workflow file out of `docs/plans/`, and archived
  superseded handoff/plan/review documents.

## 2026-09-10
- Switched the Jest transformer from `babel-jest` to `ts-jest` with `jsx: 'react-jsx'`.
- Removed `export const runtime = 'edge'` from API routes, fixing the `pnpm preview` build.
- Added the `github_repo` column plus `db/migrations/0002_add_github_repo.sql`.

## 2026-08-31
- Added a comprehensive codebase review report (since superseded — see the 2026-09-12 fixes).

## 2026-08-07
- Added the missing `postcss.config.mjs` so Tailwind actually compiled.
- Added a design-system audit.

## 2026-08-05
- Polished dashboard glass surfaces; removed stray `babel.config.*.bak` files.

## 2026-08-02
- Added the CI smoke build workflow (`.github/workflows/ci-smoke.yml`).
- Fixed the root babel config so Next.js kept using SWC.

## 2026-07-30
- Added the Jest runner and snapshot tests for `Header` and `ProjectCard`.
- Added design tokens (`src/app/tokens.css`) and the first `src/components/ui/` primitives.
- Added GitHub Copilot review instructions.
- Added project and resource lifecycle actions (edit/delete/archive), and wired the creation
  buttons.
- Migrated the dashboard from `@cloudflare/next-on-pages` to `@opennextjs/cloudflare`.

## 2026-07-29
- Completed quick capture (bookmarklet landing form).
- Reverted the abandoned "AI intelligence MVP" attempt, and corrected the documentation to
  stop describing AI-assisted *development* as a product phase.
- Next.js 15 compatibility: dynamic route params moved to the promise form.
- Documented the local D1 initialization step.

## 2026-07-28
- Implemented GitHub sync + stale detection.
- Introduced the OLED-black + glassmorphism design language.

## 2026-07-26
- Pinned Wrangler, patched Next.js, added `@cloudflare/workers-types`, fixed body type casts.
- Created `TODO.md` to track deferred work.

## 2026-07-24
- Initial scaffold: Next.js + Cloudflare + D1 structure.
- Made the Phase 1 CRUD layer functional against D1.

---

## Historical note — retired phase numbering

The roadmap originally numbered its work "Phase 1…5". The numbering drifted: at different
points "Phase 4" meant *AI-assisted development*, *Polish & Iterate*, or *GitHub sync as a
real feature*, and one document invented a "Phase 6" that existed nowhere else.

Numbering was **retired above 3** on 2026-09-16. Phases 1–3 are closed historical eras;
everything after is identified by name (see `README.md` → Status).
