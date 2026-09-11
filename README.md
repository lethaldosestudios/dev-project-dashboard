# Dev Project Dashboard

> A self-hosted project command center. One screen that answers the only question that matters: **what needs my attention right now?**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=next.js&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat&logo=cloudflare&logoColor=white)
![SQLite](https://img.shields.io/badge/D1_(SQLite)-003B57?style=flat&logo=sqlite&logoColor=white)

---

## What is it?

Dev Project Dashboard is a single-user dashboard for tracking the scattered links, notes, and GitHub activity that come with running multiple active projects. No SaaS, no lock-in — your data lives in a Cloudflare D1 database you own, served from a Cloudflare Worker, styled with a dark glassmorphism UI.

It started as a "new-tab project dashboard" itch: bookmarks and notes were spread across a dozen places with no single owned view. This is the fix.

---

## Current status

| Phase | Status |
|---|---|
| Phase 1 — Core CRUD, search, dark mode, attention panel | ✅ Complete |
| Phase 2 — GitHub sync + stale detection | ✅ Complete |
| Phase 3 — Bookmarklet quick capture | ✅ Complete |
| Phase 4 — AI-assisted development & visual/design review | 🔄 Next |

The app builds, previews, and deploys cleanly. See [`TODO.md`](./TODO.md) for the single known feature gap (notes edit/delete) and any deferred work.

---

## Features

- **Project dashboard** — an "attention-first" homepage listing active projects by recent activity, with a dedicated **stale-project flag** (14+ days without a touch).
- **Project detail pages** — notes, resources, and typed links per project.
- **Resources** — save links with title, normalize/dedupe by URL, tag them, and capture where they came from.
- **Notes** — lightweight markdown notes via a chat-style editor.
- **GitHub sync** — pull repo activity into the dashboard, update project `last_activity_at`, and flag stale projects automatically.
- **Global search** — one box across projects, notes, and resources.
- **Bookmarklet capture** — save a resource from any page in under 10 seconds (install link lives in Settings).
- **Glassmorphism UI** — dark mode by default, built on Tailwind + shadcn/ui primitives.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Hosting | Cloudflare Workers (via OpenNext) |
| Database | Cloudflare D1 (SQLite), raw `prepare()`/`bind()` — no ORM |
| Auth | Cloudflare Access (see [Authentication](#authentication)) |
| GitHub | REST/GraphQL API via a Personal Access Token |
| Testing | Jest + ts-jest + @testing-library/react |

---

## Project structure

```
dev-project-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Home / "needs attention" dashboard
│   │   ├── projects/
│   │   │   ├── page.tsx            # Project list
│   │   │   └── [slug]/page.tsx     # Project detail
│   │   ├── search/page.tsx
│   │   ├── capture/page.tsx        # Bookmarklet landing target
│   │   ├── settings/page.tsx
│   │   ├── api/
│   │   │   ├── projects/route.ts
│   │   │   ├── projects/[id]/route.ts
│   │   │   ├── resources/route.ts
│   │   │   ├── resources/[id]/route.ts
│   │   │   ├── notes/route.ts
│   │   │   ├── search/route.ts
│   │   │   ├── capture/route.ts
│   │   │   └── sync/
│   │   │       ├── github/route.ts
│   │   │       └── deploys/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # shadcn/ui + custom glass components
│   │   ├── project-card.tsx
│   │   ├── resource-list.tsx
│   │   ├── notes-editor.tsx
│   │   ├── search-bar.tsx
│   │   ├── attention-panel.tsx
│   │   ├── github-sync-status.tsx
│   │   ├── github-activity-feed.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── db.ts                   # D1 client + query helpers
│   │   ├── auth.ts                 # Cloudflare Access helper
│   │   ├── github.ts               # GitHub API client
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── db/
│   ├── schema.sql
│   └── migrations/
│       ├── 0001_init.sql
│       └── 0002_add_github_repo.sql
├── public/
├── .env.example
├── .dev.vars.example
├── wrangler.jsonc
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── jest.config.cjs
├── tsconfig.json
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 18+ and [pnpm](https://pnpm.io/)
- A Cloudflare account (for Workers + D1)
- (Optional) a GitHub Personal Access Token with `repo` scope, for GitHub sync

### 1. Install

```bash
pnpm install
```

### 2. Create the D1 database

```bash
pnpm dlx wrangler d1 create dev-project-dashboard-db
```

Copy the `database_id` from the output into `wrangler.jsonc`.

### 3. Apply the schema

```bash
pnpm dlx wrangler d1 execute dev-project-dashboard-db --file=./db/schema.sql
pnpm dlx wrangler d1 execute dev-project-dashboard-db --local --file=./db/schema.sql
```

### 4. Configure environment

Copy `.env.example` → `.env` and `.dev.vars.example` → `.dev.vars`, then fill in `GITHUB_TOKEN`. Authentication in production is handled by Cloudflare Access (see [Authentication](#authentication)), so no local password is required.

### 5. Run locally

```bash
pnpm dev
```

Development preview: `http://localhost:3000`

---

## Preview & deploy

```bash
pnpm preview   # Cloudflare-parity local preview at http://localhost:8787
pnpm deploy    # deploy the Worker to Cloudflare
pnpm build     # standard Next.js production bundle (no server)
```

| Command | What it does |
|---|---|
| `pnpm dev` | Fast Next.js dev server with the OpenNext platform bridge + local D1 bindings |
| `pnpm preview` | Builds with OpenNext and serves the Worker via Wrangler's local runtime at `http://localhost:8787` |
| `pnpm build` | Standard Next.js production bundle only |
| `pnpm deploy` | OpenNext build + deploy to Cloudflare Workers |
| `pnpm test` | Run the Jest test suite |

---

## Authentication

Production is protected by **Cloudflare Access**. After Access authenticates a request, it injects a `Cf-Access-User-Email` header, which `src/lib/auth.ts` validates.

- All **mutation** endpoints (`POST`/`PATCH`/`DELETE`) check this header via `requireAuth()` before touching the database.
- **Read** endpoints (dashboard views, lists, search) are left open — single-user by design.
- **Local development** (`pnpm dev` / `pnpm preview`) bypasses auth, since Cloudflare Access doesn't run locally. The bypass only applies when `NODE_ENV !== 'production'`, so it never triggers on a deployed Worker.

To link projects to repos for GitHub sync, set a project's `github_repo` field to `owner/repo` and pass a GitHub token via the `x-github-token` header (or set `GITHUB_TOKEN` in `.dev.vars` / `wrangler secret put`).

---

## Known limitations & roadmap

- **Notes can be created but not edited or deleted individually** — the only gap in CRUD parity. Tracked in [`TODO.md`](./TODO.md) as Issue #9.
- **Phase 4** (AI-assisted development and visual/design review) is next on the roadmap. The AI models are development-time tools only — the deployed dashboard never requires them or their credentials.

For the full picture of open work and deferred items, see **[`TODO.md`](./TODO.md)**.

---

## License

Private / personal project. Not currently licensed for redistribution.