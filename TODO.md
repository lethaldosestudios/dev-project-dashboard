<!-- verified-against: a7e29e2 | verified: 2026-09-23 -->
# TODO — Open Issues & Deferred Work

This file is **forward-looking only**. It lists what is open, broken, or deferred. It contains no
history — completed work is recorded in [`CHANGELOG.md`](./CHANGELOG.md).

Read this before starting new work so nothing gets silently forgotten. Every item below was
confirmed against the code on the date this file was last verified (see the stamp above).

---

## Open

No open items. The **Feature parity** workstream is complete — notes edit/delete, tags,
and project links all have write paths and UI as of 2026-09-18. See
[`CHANGELOG.md`](./CHANGELOG.md) for the delivery entries.

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

### Vercel deploy widgets
Cloudflare deploy sync is implemented (`src/app/api/sync/deploys/route.ts` + `src/lib/cloudflare.ts`
with a dashboard widget); Vercel would follow the same pattern. Not started.

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
