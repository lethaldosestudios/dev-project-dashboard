<!-- verified-against: b5396e5bbd2ca0b8b166b122ef9f9af8ad429e38 | verified: 2026-09-16 -->
# TODO — Open Issues & Deferred Work

This file is **forward-looking only**. It lists what is open, broken, or deferred. It contains no
history — completed work is recorded in [`CHANGELOG.md`](./CHANGELOG.md).

Read this before starting new work so nothing gets silently forgotten. Every item below was
confirmed against the code on the date this file was last verified (see the stamp above).

---

## Open

### 1. Notes are create-only — no edit or delete (feature gap)
- **Logged:** 2026-09-11
- **Details:** `POST /api/notes` creates a note, but there is no `src/app/api/notes/[id]/route.ts`
  and no edit/delete UI in `src/components/notes-editor.tsx`. Notes are only removed indirectly, by
  cascade, when their project is deleted. Projects and resources both have full CRUD; notes do not.
- **Fix:** Add `src/app/api/notes/[id]/route.ts` with `PATCH`/`DELETE` (auth-guarded, following the
  `resources/[id]` pattern), plus edit/delete controls in the notes editor.

### 2. Search results link to the wrong URL for notes and resources
- **Logged:** 2026-09-16
- **Details:** `src/app/search/page.tsx` builds note and resource links as
  `/projects/<result.project_id>`, but the detail route resolves projects by **slug**
  (`src/app/projects/[slug]/page.tsx`). `project_id` is a UUID, so those results land on
  "Project not found".
- **Fix:** Have `/api/search` return the project `slug` alongside `project_id`, and link with it.

### 3. Renaming a project does not update its slug
- **Logged:** 2026-09-16
- **Details:** `PATCH /api/projects/[id]` updates `name` but never `slug`, so every existing link
  and bookmark to that project goes stale. Separately, `slug` is `UNIQUE` and `POST /api/projects`
  has no error handling around the insert, so creating two projects with the same name throws an
  unhandled error and returns a 500 instead of a friendly message.
- **Fix:** Re-derive and persist `slug` on rename, and either catch the uniqueness violation to
  return 400 or disambiguate with a numeric suffix.

### 4. Adding a note does not refresh the list
- **Logged:** 2026-09-16
- **Details:** `src/components/notes-editor.tsx` posts the new note but never re-renders — the
  component's own comment acknowledges the gap. A newly added note stays invisible until the page
  is manually reloaded, which reads as a failed save.
- **Fix:** Call `router.refresh()` after a successful post, matching `ProjectDialog` and
  `ResourceDialog`.

### 5. Two mutation routes do not call `requireAuth()`
- **Logged:** 2026-09-16
- **Details:** `POST /api/capture` and `POST /api/sync/deploys` are the only mutation handlers in
  `src/app/api/` without an auth check. `AGENTS.md` mandates one on every `POST`/`PATCH`/`DELETE`.
  They are declared exemptions in `scripts/docs-check.mjs` so the omission is explicit rather than
  silent, but the rule should hold with zero exemptions.
- **Why it may be intentional:** `/api/capture` is the bookmarklet target, which runs in an
  already-authenticated browser session; `/api/sync/deploys` is a no-op stub that writes only its
  own `sync_runs` row. Confirm the intent before changing either.
- **Fix:** Add `requireAuth()` to both (then remove them from the exemption allowlist), or document
  them as deliberately public in [`README.md`](./README.md) and `AGENTS.md`.

### 6. `POST /api/sync/deploys` is a no-op stub
- **Logged:** 2026-09-16
- **Details:** The route writes a `sync_runs` row and returns success without performing any work.
  It reports `records_processed: 0` and `ok: true`, which is indistinguishable from a successful
  sync.
- **Fix:** Either implement deploy sync, or remove the route until it is real.

### 7. Tagging has no write path
- **Logged:** 2026-09-16
- **Details:** `tags` and `resource_tags` exist in `db/schema.sql`, but no route or component ever
  inserts into either table. They appear only in cascade `DELETE`s.
- **Fix:** Add tag CRUD and a resource↔tag association endpoint, or drop the tables.

### 8. Project links have no write path
- **Logged:** 2026-09-16
- **Details:** `project_links` is read by the detail page and cascade-deleted with its project, but
  there is no route or UI to create a link. The "Links" section can never populate through the app.
- **Fix:** Add `POST`/`PATCH`/`DELETE` for project links plus UI in the project dialog.

### 9. The `/projects` header search input is not wired
- **Logged:** 2026-09-16
- **Details:** `src/app/projects/page.tsx` renders a `GlowInput` in its header with no `value` or
  `onChange`, so typing does nothing. The page also does not render the `Filters` or `SearchBar`
  components that exist for this purpose.
- **Fix:** Wire the input to a filter over the rendered projects, or remove it and point at
  `/search`.

### 10. Capture dedupe scope differs from resource dedupe scope
- **Logged:** 2026-09-16
- **Details:** `POST /api/capture` dedupes `normalized_url` **globally**, while
  `POST /api/resources` dedupes it **per project**. Saving the same URL through the bookmarklet
  into a second project therefore reports "already captured" and attaches nothing.
- **Fix:** Pick one scope and apply it to both paths.

### 11. GitHub sync is unpaginated, N+1, and misreports `skipped`
- **Logged:** 2026-09-16
- **Details:** `POST /api/sync/github` calls `fetchUserRepos` with `per_page=100` and no pagination,
  silently ignoring repos beyond the first 100. For each linked repo it issues one events request,
  then one `SELECT` plus one `INSERT` per event. The response's `skipped` count is hardcoded to `0`
  even when duplicate events are skipped. There is no rate-limit or backoff handling.
- **Why it matters:** this runs on Cloudflare Workers, which cap subrequests per request.
- **Fix:** Paginate repo discovery, batch the existence checks into a single `IN (...)` query, and
  report the real skipped count.

### 12. `requireAuth()`'s production bypass depends on an inlined `NODE_ENV`
- **Logged:** 2026-09-16
- **Details:** `src/lib/auth.ts` bypasses auth whenever `process.env.NODE_ENV !== 'production'`.
  There is no `middleware.ts`, so pages perform no auth of their own. This is almost certainly safe
  because Next.js inlines `NODE_ENV` at build time for server code — but the entire
  public-vs-authenticated boundary rests on that implicit substitution rather than an explicit
  check.
- **Fix:** Assert the environment explicitly (e.g. a dedicated `ALLOW_DEV_AUTH_BYPASS` flag), and
  confirm behaviour on a deployed Worker.

### 13. Six components are exported but never imported
- **Logged:** 2026-09-16
- **Details:** `src/components/project-header.tsx`, `src/components/ui/sidebar.tsx`,
  `src/components/search-bar.tsx`, `src/components/ui/filters.tsx`,
  `src/components/ui/dashboard-grid.tsx`, and `src/components/ui/empty-state.tsx` are re-exported
  from `src/components/ui/index.ts` but used nowhere.
- **Fix:** Delete them, or wire them up where intended. (`project-header.tsx` overlaps heavily with
  the inline header in `src/app/projects/[slug]/page.tsx`.)

### 14. Duplicate `GitHubActivity` type with two different shapes
- **Logged:** 2026-09-16
- **Details:** `src/types/index.ts` and `src/lib/github.ts` both export a `GitHubActivity`, and the
  two disagree (the type module requires `created_at`; the client module omits it).
- **Fix:** Keep one definition and import it.

### 15. `GET /api/resources` silently truncates
- **Logged:** 2026-09-16
- **Details:** Without a `projectId`, the route applies `LIMIT 100` with no indication in the
  response that more rows exist.
- **Fix:** Paginate, or return a total so the UI can tell the difference.

### 16. URL normalization keeps query strings, weakening dedupe
- **Logged:** 2026-09-16
- **Details:** `normalizeUrl` in `src/lib/utils.ts` strips the fragment and trailing slash but keeps
  the query string, so `?utm_source=…` variants of the same page are treated as distinct resources.
- **Fix:** Strip known tracking parameters before comparison.

### 17. `pnpm test` fails when `NODE_ENV=production` is exported
- **Logged:** 2026-09-16
- **Details:** Jest defers to an explicitly set `NODE_ENV`, so when the shell exports
  `NODE_ENV=production`, React resolves to its production build and every suite fails with
  "act(...) is not supported in production builds of React". Both suites pass under
  `NODE_ENV=test`. This environment exports `NODE_ENV=production`, so the documented `pnpm test`
  command does not work as written here.
- **Fix:** Pin `NODE_ENV=test` in the Jest configuration or the test script, so the result does not
  depend on the caller's shell.

---

## Deferred

### Polish
Visual and functional refinement, plus whatever surfaces during real use. Not scheduled.
Surfaced items include an extracted `<Badge>` component (the pill pattern is hand-written in four
places) and a decision on the icon strategy — `lucide-react` is a dependency used by two files while
inline SVGs are redefined elsewhere.

### AI Features
Product-facing AI capabilities. **Not committed work.** Explicitly separate from the AI-assisted
*development* workflow in [`AI-DEV-WORKFLOW.md`](./AI-DEV-WORKFLOW.md), which is a dev-time aid only
and never ships into the app.

### Deploy sync
Vercel/Cloudflare deploy widgets. Currently represented only by the no-op stub in item 6.

---

## How to use this file

- Add a numbered entry under **Open** whenever a fix is consciously deferred during setup, build,
  deployment, or feature work.
- Include: the date logged, what is wrong, where (file paths), why it matters, and what "fixed"
  looks like.
- **Mark it done by deleting it** and recording the resolution in [`CHANGELOG.md`](./CHANGELOG.md).
  This file never accumulates a "Resolved" section — history belongs in the changelog.
- Run `pnpm docs:check` before committing. It verifies the file paths named here exist (or are
  declared as planned) and that no retired phase numbers crept back in.
