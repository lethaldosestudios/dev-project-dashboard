<!-- verified-against: b5396e5bbd2ca0b8b166b122ef9f9af8ad429e38 | verified: 2026-09-16 -->
# Dev Project Dashboard

> A self-hosted project command center. One screen that answers the only question that matters: **what needs my attention right now?**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=next.js&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat&logo=cloudflare&logoColor=white)
![SQLite](https://img.shields.io/badge/D1_(SQLite)-003B57?style=flat&logo=sqlite&logoColor=white)

---

## What is it?

Dev Project Dashboard is a single-user dashboard for tracking the scattered links, notes, and
GitHub activity that come with running multiple active projects. No SaaS, no lock-in — your data
lives in a Cloudflare D1 database you own, served from a Cloudflare Worker, styled with a dark
glassmorphism UI.

It started as a "new-tab project dashboard" itch: bookmarks and notes were spread across a dozen
places with no single owned view. This is the fix.

---

## Status

Numbered phases 1–3 are closed historical eras. Numbering above 3 was **retired** — it had come to
mean three different things at once. Everything after Phase 3 is identified by name.

| Era | Scope | Status |
|---|---|---|
| Phase 1 | Core CRUD, search, dark mode, attention panel | ✅ Closed |
| Phase 2 | GitHub sync + stale detection | ✅ Closed |
| Phase 3 | Quick capture (bookmarklet) | ✅ Closed |
| — | **GitHub Sync** — repo linking, `repo_metadata`, real activity | ✅ Delivered 2026-09-13 |
| — | **Hardening** — correctness & security fixes | 🔄 Next |
| — | **Polish** — visual & functional refinement | ⏳ Queued |
| — | **AI Features** — product-facing AI | ⏳ Deferred, not committed |

The app builds, previews, and deploys cleanly. See [`TODO.md`](./TODO.md) for open issues and the
honest limitations list below for what is knowingly incomplete.

---

## Features

What is actually implemented today.

- **Dashboard** (`/`) — stat strip (total / active / needs attention / recent activity), an
  **attention panel** listing every project with no activity in 14+ days (or never), and a grid of
  active projects ordered by `last_activity_at` with per-project activity counts.
- **Project list** (`/projects`) — the same stat strip and card grid across all active projects, with
  a client-side filter over name, description, stack, and linked repo.
- **Project detail** (`/projects/[slug]`) — status/priority badges, repo metadata, a stats bar,
  project links, GitHub activity feed, resources, and notes.
- **Resources** — add, edit, and delete links with an optional title and note. URLs are normalized
  (fragment, trailing slash, and tracking parameters such as `utm_*` / `fbclid` stripped) and
  deduplicated on one rule: **a URL may exist once per project, and once unassigned**. The domain
  and `saved_via` source are recorded.
- **Notes** — create plain-text notes with an optional title. Stored in `notes.content_md` and
  rendered as preformatted text. **Not markdown-rendered, and not editable or deletable** (see
  limitations).
- **Search** (`/search`) — a debounced (300 ms) query across projects, notes, and resources. Note
  and resource results link through to the owning project.
- **Quick capture** (`/capture`) — a form prefilled from query params for saving a link in seconds.
  A **bookmarklet** generated from your current origin is installable from `/settings`.
- **GitHub sync** — matching a project's `github_repo` against your repos, pulling recent events
  into `github_activity` (deduplicated by `external_id`), updating `last_activity_at`, and storing a
  display string in `repo_metadata` (e.g. `⭐ 42 · 🐛 3 · TypeScript`). Each run is recorded in
  `sync_runs` and reports how many events were added versus already known.
- **Design language** — OLED-black base with a glass/glow system. See [`DESIGN.md`](./DESIGN.md).

### Not implemented

These exist in the schema or were previously claimed as features, but have **no write path**:

- **Tagging.** `tags` and `resource_tags` are in [`db/schema.sql`](./db/schema.sql), but nothing
  ever inserts into them.
- **Project links.** `project_links` is read and cascade-deleted, but there is no route or UI to
  create a link, so the "Links" section only ever renders rows inserted by hand.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + React 18 + TypeScript + Tailwind CSS |
| Components | Bespoke glass components in `src/components/ui/` — **not** shadcn/ui |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` (OpenNext) |
| Database | Cloudflare D1 (SQLite), raw `prepare()`/`bind()` — no ORM |
| Auth | Cloudflare Access ([`src/lib/auth.ts`](./src/lib/auth.ts)) |
| GitHub | REST API via a personal access token ([`src/lib/github.ts`](./src/lib/github.ts)) |
| Tests | Jest + ts-jest + @testing-library/react (2 component suites) |

---

## Project structure

```
dev-project-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Dashboard / "needs attention"
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── tokens.css
│   │   ├── projects/
│   │   │   ├── page.tsx            # Project list
│   │   │   └── [slug]/page.tsx     # Project detail
│   │   ├── search/page.tsx
│   │   ├── capture/page.tsx        # Bookmarklet landing target
│   │   ├── settings/page.tsx
│   │   └── api/
│   │       ├── projects/route.ts            # GET, POST
│   │       ├── projects/[id]/route.ts       # GET, PATCH, DELETE
│   │       ├── resources/route.ts           # GET, POST
│   │       ├── resources/[id]/route.ts      # PATCH, DELETE
│   │       ├── notes/route.ts               # GET, POST
│   │       ├── search/route.ts              # GET
│   │       ├── capture/route.ts             # POST
│   │       └── sync/
│   │           └── github/route.ts          # POST, GET
│   ├── components/
│   │   ├── ui/                     # glass-card, liquid-button, glow-input, header…
│   │   ├── project-card.tsx
│   │   ├── project-dialog.tsx
│   │   ├── project-actions.tsx
│   │   ├── resource-list.tsx
│   │   ├── resource-dialog.tsx
│   │   ├── resource-actions.tsx
│   │   ├── notes-editor.tsx
│   │   ├── attention-panel.tsx
│   │   ├── github-sync-status.tsx
│   │   ├── github-activity-feed.tsx
│   │   └── bookmarklet-install.tsx
│   ├── lib/
│   │   ├── db.ts                   # D1 access + id/timestamp helpers
│   │   ├── auth.ts                 # requireAuth()
│   │   ├── github.ts               # GitHub REST client + transforms
│   │   ├── utils.ts                # URL/slug/GitHub-ref normalization
│   │   └── cn.ts
│   └── types/index.ts
├── db/
│   ├── schema.sql
│   └── migrations/                 # 0001_init, 0002_add_github_repo, 0003_add_repo_metadata
├── scripts/
│   └── docs-check.mjs              # docs:check — keeps these docs honest
├── .github/workflows/ci-smoke.yml
└── wrangler.jsonc
```

---

## Getting started

### Prerequisites

- Node.js 18+ and [pnpm](https://pnpm.io/)
- A Cloudflare account (for Workers + D1)
- (Optional) a GitHub personal access token, for GitHub sync

### 1. Install

```bash
pnpm install
```

### 2. Create the D1 database

```bash
pnpm dlx wrangler d1 create dev-project-dashboard-db
```

Copy the `database_id` from the output into [`wrangler.jsonc`](./wrangler.jsonc).

### 3. Apply the schema

```bash
pnpm dlx wrangler d1 execute dev-project-dashboard-db --file=./db/schema.sql
pnpm dlx wrangler d1 execute dev-project-dashboard-db --local --file=./db/schema.sql
```

### 4. Configure environment

Copy [`.env.example`](./.env.example) → `.env` and
[`.dev.vars.example`](./.dev.vars.example) → `.dev.vars`, then fill in `GITHUB_TOKEN`.

Authentication in production is handled by Cloudflare Access, so no application password is
required. Locally, `requireAuth()` bypasses the check whenever `NODE_ENV !== 'production'`.

### 5. Run locally

```bash
pnpm dev
```

Development server: `http://localhost:3000`

---

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server with local D1 bindings |
| `pnpm preview` | OpenNext build + Wrangler's local Workers runtime at `http://localhost:8787` |
| `pnpm build` | Standard Next.js production bundle |
| `pnpm deploy` | OpenNext build + deploy to Cloudflare Workers |
| `pnpm test` | Jest suite |
| `pnpm docs:check` | Verify documentation claims still match the code |

---

## Authentication

Production is protected by **Cloudflare Access**, which injects a `Cf-Access-User-Email` header
after authenticating a request. `requireAuth()` in [`src/lib/auth.ts`](./src/lib/auth.ts) accepts
that header, and returns 401 if it is absent. The header is checked first, so a deployed Worker
behind Access never falls through to the local bypass.

Access does not run locally, so local development opts in explicitly by setting
`DEV_AUTH_BYPASS=true` in [`.dev.vars.example`](./.dev.vars.example) (copied to `.dev.vars`). That
file is gitignored and never deployed, so a production Worker cannot inherit the flag — and
`requireAuth()` fails closed when the Cloudflare context is unavailable.

Every mutation route calls `requireAuth()`:

- `POST /api/projects`, `PATCH`/`DELETE /api/projects/[id]`
- `POST /api/resources`, `PATCH`/`DELETE /api/resources/[id]`
- `POST /api/notes`
- `POST /api/capture`
- `POST`/`GET /api/sync/github`

Read endpoints (list, detail, search) are left open by design: this is a single-user app, and the
boundary that matters is public-internet-vs-authenticated. `pnpm docs:check` enforces this list —
its exemption allowlist is empty, so a new mutation route without a check fails CI.

---

## GitHub sync

Link a project to a repo by setting its `github_repo` field to `owner/repo` (a full GitHub URL is
also accepted and normalized). Then either click **Sync GitHub** on the dashboard, or call the
endpoint directly.

The token is read from the `x-github-token` request header if present, falling back to the
`GITHUB_TOKEN` Cloudflare secret (`wrangler secret put GITHUB_TOKEN`) or `.dev.vars` locally.

---

## Known limitations

- **Notes are create-only.** There is no `notes/[id]` route and no edit/delete UI. Notes are
  removed only indirectly, by cascade, when their project is deleted.
- **Renaming a project does not update its slug (by design).** Slug is a stable permalink set once
  at creation, so renaming a project leaves its URL working. A new project whose name collides gets
  a numeric suffix (`my-project`, `my-project-2`, …).
- **GitHub sync caps repo discovery at 1000 repos** (10 pages of 100) and performs no rate-limit
  backoff. It still issues one events request per linked repo.
- **URL normalization applies at write time only.** Resources captured before tracking parameters
  were stripped keep their stored `normalized_url`, so historical near-duplicates are not merged.

Each of these is recorded in [`TODO.md`](./TODO.md).

---

## Documentation map

**Canonical** — these must stay true, and are checked by `pnpm docs:check`:

| File | Answers |
|---|---|
| [`README.md`](./README.md) | What the app is, how to run it, what is incomplete |
| [`TODO.md`](./TODO.md) | What is open, deferred, or knowingly broken |
| [`AGENTS.md`](./AGENTS.md) | Rules for AI agents working in this repo |
| [`DESIGN.md`](./DESIGN.md) | The design system as actually implemented |
| [`AI-DEV-WORKFLOW.md`](./AI-DEV-WORKFLOW.md) | The dev-time AI toolchain (never ships) |
| [`CHANGELOG.md`](./CHANGELOG.md) | Dated history — **never** a statement about current state |

**Not canonical** — never treat as specification:

- `.git/**` — internal, including commit-message scratch files
- `docs/**` — the owner's private scratch space
- `.next/**`, `.open-next/**`, `.vercel/**`, `node_modules/**`
- any worktree outside this checkout

**The code is the source of truth.** If a document disagrees with the code, the code is right and
the document is a bug — every state doc carries a `verified-against:` commit stamp so you can see
when it was last reconciled.

---

## License

Private / personal project. Not currently licensed for redistribution.
