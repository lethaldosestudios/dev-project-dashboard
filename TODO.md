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

### 11. GitHub sync is unpaginated, N+1, and misreports `skipped`
- **Logged:** 2026-09-16
- **Details:** `POST /api/sync/github` calls `fetchUserRepos` with `per_page=100` and no pagination,
  silently ignoring repos beyond the first 100. For each linked repo it issues one events request,
  then one `SELECT` plus one `INSERT` per event. The response's `skipped` count is hardcoded to `0`
  even when duplicate events are skipped. There is no rate-limit or backoff handling.
- **Why it matters:** this runs on Cloudflare Workers, which cap subrequests per request.
- **Fix:** Paginate repo discovery, batch the existence checks into a single `IN (...)` query, and
  report the real skipped count.

### 13. Six components are exported but never imported
- **Logged:** 2026-09-16
- **Details:** `src/components/project-header.tsx`, `src/components/ui/sidebar.tsx`,
  `src/components/search-bar.tsx`, `src/components/ui/filters.tsx`,
  `src/components/ui/dashboard-grid.tsx`, and `src/components/ui/empty-state.tsx` are re-exported
  from `src/components/ui/index.ts` but used nowhere.
- **Fix:** Delete them, or wire them up where intended. (`project-header.tsx` overlaps heavily with
  the inline header in `src/app/projects/[slug]/page.tsx`.)

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
Vercel/Cloudflare deploy widgets. Not started — the no-op placeholder route was removed on
2026-09-16, so there is no stub to build on.

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
