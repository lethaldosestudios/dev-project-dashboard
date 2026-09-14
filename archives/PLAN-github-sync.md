# Phase 4 — GitHub Sync as a Real Feature (Task Proposal)

> **Status:** Proposal (awaiting approval before execution)
> **Authored:** 2026-09-12
> **Goal:** Turn the currently-hypothetical GitHub sync into a real, usable feature so the app has real project data to inform every subsequent Phase 4 UI polish decision.

---

## Why this is the right next step

The user needs real GitHub-derived data (commits, PRs, issues, repo metadata) in the dashboard *before* UI polish, because there's nothing concrete to polish against until projects actually carry activity. Today the plumbing exports (#1) is inert: the sync endpoint works but is effectively unreachable, unlinked, and invisible.

---

## Current state (what exists today)

**Working:**
- `src/lib/github.ts` — a complete GitHub REST client: fetch repos, events, commits, issues, PRs, plus activity extraction and "last activity / stale" helpers.
- `src/app/api/sync/github/route.ts` — `POST` fetches all user repos, matches them to projects via `github_repo`, de-dupes events into `github_activity`, updates `projects.last_activity_at`, and writes `sync_runs`. `GET` returns recent sync history.
- `github_activity` + `sync_runs` tables exist in `db/schema.sql`.
- `Project.github_repo` field exists (types + schema + migration `0002`).
- `GitHubActivityFeed` is wired into the project detail page; `GitHubSyncStatus` is wired into the `/` Dashboard header.

**Broken / missing (the actual work):**
1. **No auth on the sync route.** Every POST/PATCH/DELETE route calls `requireAuth()` — `sync/github` does **not**, making it the only unprotected mutation route in the API (🔴 per AGENTS.md).
2. **The sync button renders but can't do anything useful yet.** `GitHubSyncStatus` **is already rendered** on the `/` Dashboard header (left of `+ New Project`), and is already wired to `lastSync` state queried from `sync_runs`. The actual gap is not a missing control — it's that clicking Sync currently syncs *nothing*, because (see #3) no repo is linked to any project, so `fetchUserRepos` matches zero rows and the run is a no-op.
3. **No way to link a repo to a project.** `github_repo` is never written by any API route or the `ProjectDialog` — a user cannot connect a repo to a project, so the sync's whole matching step is a no-op.
4. **Dead-code mapping.** `REPO_TO_PROJECT = {}` in `github.ts` (the TODO #10 🟢 item) — a hardcoded map that's empty and redundant with the `github_repo` DB fallback. Retiring it is part of making this feature honest.
5. **Token plumbing is half-env / half-header and untyped.** Token resolution reads `x-github-token` header first, falls back to `GITHUB_TOKEN` env, but nothing ever sends that header, and the env is cast `as { GITHUB_TOKEN?: string }`.
6. **No repo metadata is persisted** — `GitHubRepo` fields (`language`, `stargazers_count`, `open_issues_count`, description, visibility) are fetched but discarded. The activity feed only surfaces events, not the richer "what does this project look like on GitHub" signal the user actually wants.

---

## Proposed scope — 5 work items

Split into reviewable commits. Each item is independently shippable.

### 1. 🔴 Auth-guard the sync route (and add repo-linking API support)
- Add `requireAuth(req)` to both `POST` and `GET` in `src/app/api/sync/github/route.ts`, returning early on 401, matching every other mutation route.
- (Enables the client-side button in item 2 to actually work, since dev bypass and prod Access both now behave consistently.)

### 2. Make `github_repo` writable so repos can be linked to projects
- Add `github_repo` to the `ProjectDialog` form (create + edit): a single text input, normalized to `owner/repo` (trim, validate `owner/repo` shape, cap length).
- Add `github_repo` handling to `POST /api/projects` and `PATCH /api/projects/[id]`: validate with `typeof` + trim + a `^[^/\s]+/[^/\s]+$` shape check (or allow empty to clear), store as-is or null.
- Surface the linked repo more prominently via the existing `project.github_repo` link in `project-header.tsx` (already renders).

### 3. Keep the existing "Sync GitHub" control (no relocation) and make it work
- The `GitHubSyncStatus` button is **already rendered** on the `/` Dashboard header (in `src/app/page.tsx`) and already receives `lastSync` from a `sync_runs` query. **No move is needed** — it stays in its current, correct location (a global, list-level action next to `+ New Project`). It should **not** be duplicated onto `/projects` or `/projects/[slug]`.
- Fix the empty `headers: {}` object on the `fetch("/api/sync/github")` call: the route should rely on `requireAuth` + server-side `GITHUB_TOKEN` env only. The UI must **not** send a token client-side — secrets must not reach the client bundle. (The `x-github-token` header fallback can remain for scripted/non-UI use.)
- The "Synced Xm ago" display already exists via the `lastSync` prop + the component's `status`/`records_processed` rendering; confirm it surfaces the run recorded by the (now-auth-guarded) `POST`.

### 4. Persist repo metadata (give projects real GitHub shape)
- Add a single **`repo_metadata` TEXT (JSON) column** to `projects` via a new numbered migration `0003_add_repo_metadata.sql` (and matching `db/schema.sql` edit). **Decision locked:** JSON blob (Option A), not granular columns — the metadata is display-only, so one `JSON.stringify` on write / `JSON.parse` on read is simpler and non-breaking, and the app never filters/sorts projects by star/language count.
- During sync, for each matched repo, store `language`, `star_count`, `open_issue_count`, `description`, `visibility`, `archived`, `default_branch` into `repo_metadata` and set `updated_at`.
- Render this metadata on the project detail page / card (e.g. a small "⭐ 42 · 🐛 3 · TypeScript" line), giving the dashboard a real "this is what the project is" signal.

### 5. Retire the dead `REPO_TO_PROJECT` mapping (close TODO #10 🟢)
- Delete `REPO_TO_PROJECT` and `getProjectIdForRepo()` from `src/lib/github.ts`.
- The sync route already falls back to `SELECT id FROM projects WHERE github_repo = ?`; make that the *only* matching path.
- Update TODO.md #10 to mark this suggestion resolved.

---

## Out of scope (deliberately, for now)

- Deploy sync (`sync/deploys` placeholder) — not a GitHub feature.
- Multi-repo-per-project, org-wide sync, or webhooks/polling/background jobs — single-user manual trigger is the MVP.
- Rich diff/PR review views — the activity *feed* is enough to start.
- `Notes` edit/delete (TODO #9) — separate backlog item, not part of this task.

---

## Decisions — locked (2026-09-12)

1. **`repo_metadata` shape = single JSON TEXT column** (Option A). Display-only metadata; no SQL filtering/sorting by stars/language is planned.
2. **Sync button location = the `/` Dashboard header** (where `GitHubSyncStatus` already renders). No relocation, no duplicate on `/projects` or `/projects/[slug]`.
3. **Repo link UX = free-text `owner/repo` field** in `ProjectDialog` (no "fetch my repos" picker).
4. **Commit granularity = atomic commits, one per work item.**

---

## Acceptance criteria

- [ ] `POST`/`GET /api/sync/github` both enforce auth (401 without it, consistent with other routes).
- [ ] A project can be linked to a GitHub repo via the UI, stored in `projects.github_repo`.
- [ ] Clicking "Sync GitHub" triggers a real sync that pulls events + metadata for linked repos and visibly updates the dashboard.
- [ ] Repo metadata (stars, issues, language) appears on the project detail page.
- [ ] `REPO_TO_PROJECT` dead-code mapping is gone; TODO #10 🟢 item marked resolved.
- [ ] No secret values reach the client bundle; token stays server-side (`GITHUB_TOKEN` env / secret).
- [ ] `pnpm preview` passes with the new migration applied locally.