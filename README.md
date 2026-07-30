# Dev Project Dashboard

## 1. Mini PRD

**Origin**
This project started after reading a dev.to article describing a Chrome-extension tool (STACKFOLO-style "new tab" project dashboards). Porter never used that extension, but recognized the same underlying problem: scattered links, notes, and GitHub activity across active projects with no owned, extendable system.

**Problem**
Porter runs multiple active dev/design projects (Lethal Dose Studios, personal tools, client work) and currently tracks links, notes, and GitHub activity across scattered bookmarks with no single owned system and no automation hooks.

**Goal**
A self-hosted, single-user dashboard that answers one question fast: *what needs my attention across my projects right now?* It's a fully owned, extendable alternative to closed browser-extension tools — built on infrastructure Porter controls end to end.

**Primary user**
Porter LaForce (solo use, single-tenant).

**Core job-to-be-done**
1. See active projects and what changed recently.
2. Save a resource (link/note) to a project in under 10 seconds.
3. Track GitHub activity and flag stale projects.
4. Later: get AI-assisted tagging/summaries once real usage data exists.

**MVP scope (v1 — build now)**
- Project list + detail pages (notes, resources, typed links)
- Global search across projects/notes/resources
- Manual resource capture (URL, title, tags, note)
- Dark mode by default
- "Needs attention" / stale-project flag
- D1 schema + working CRUD API routes
- Deploy to Cloudflare Workers

**Explicitly out of MVP**
- Browser extension (bookmarklet only for now)
- AI chat over projects
- Drag-to-reorder
- Vercel deploy status widgets

**Non-goals**
- Multi-user support
- Public-facing product polish
- Third-party SaaS dependency for core data

**Success criteria**
- Daily use becomes the default workflow within 2 weeks of MVP deploy
- Capture flow takes under 10 seconds from any page
- $0–1/month infra cost maintained

**Future phases**
- Phase 2: GitHub sync + stale detection
- Phase 3: Bookmarklet quick capture
- Phase 4: AI-assisted development and visual/design review
- Phase 5: Polish (widgets, Figma panel, reordering)

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Hosting | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Auth | Cloudflare Access (fallback: single-user password + session cookie) |
| GitHub Integration | GitHub REST/GraphQL API (PAT to start) |
| AI | Development-time model assistance; not a runtime app dependency |
| Capture | Bookmarklet (Phase 3) |

## 3. Project Structure

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
│   │   │   ├── search/route.ts
│   │   │   ├── capture/route.ts
│   │   │   ├── notes/route.ts
│   │   │   └── sync/
│   │   │       ├── github/route.ts
│   │   │       └── deploys/route.ts
│   │   └── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # shadcn components
│   │   ├── project-card.tsx
│   │   ├── resource-list.tsx
│   │   ├── notes-editor.tsx
│   │   ├── search-bar.tsx
│   │   ├── attention-panel.tsx
│   │   ├── github-sync-status.tsx
│   │   ├── github-activity-feed.tsx
│   │   └── project-header.tsx
│   ├── lib/
│   │   ├── db.ts                   # D1 client + query helpers
│   │   ├── github.ts               # GitHub API client
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── db/
│   ├── schema.sql
│   └── migrations/
│       └── 0001_init.sql
├── public/
├── .env.example
├── wrangler.jsonc
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 4. Setup

```bash
pnpm install
pnpm dlx wrangler d1 create dev-project-dashboard-db
# copy resulting database_id into wrangler.jsonc
pnpm dlx wrangler d1 execute dev-project-dashboard-db --file=./db/schema.sql
pnpm dlx wrangler d1 execute dev-project-dashboard-db --local --file=./db/schema.sql
pnpm dev
```

Development preview: `http://localhost:3000`

For a Cloudflare-compatible production preview, use the OpenNext Cloudflare Worker runtime:

```bash
pnpm preview
```

Cloudflare-runtime preview: `http://localhost:8787`

## 5. Deploy

```bash
pnpm deploy
```

## Preview commands

- `pnpm dev` starts the fast Next.js development server with the OpenNext Cloudflare platform bridge and local D1 bindings.
- `pnpm preview` builds with OpenNext and serves the generated Worker through Wrangler's local Cloudflare runtime at `http://localhost:8787`.
- `pnpm build` only creates the standard Next.js production bundle. It does not start a server.

## 6. Phase 1 Status — Functional

Phase 1 CRUD is now wired to D1 (no longer stubs):
- `GET/POST /api/projects` — list + create projects
- `GET/PATCH /api/projects/:id` — fetch + update a single project
- `GET/POST /api/resources` — list (optionally by project) + create resources
- `PATCH /api/resources/:id` — update a resource
- `GET /api/search` — search across projects, notes, and resources
- `POST /api/capture` — quick-capture endpoint (normalizes + dedupes URLs)

## 7. Phase 2 Status — Functional

GitHub sync and stale detection is now implemented:
- `POST /api/sync/github` — sync GitHub activity for all user repos, update project last_activity_at
- `GET /api/sync/github` — get sync history
- `POST /api/notes` — create notes for projects
- GitHub activity feed on project detail pages
- Stale project detection (14+ days without activity)
- Activity count badges on project cards
- Sync status indicator on dashboard

To use GitHub sync:
1. Create a GitHub Personal Access Token with `repo` scope
2. Pass it in the `x-github-token` header when calling `POST /api/sync/github`
3. Link projects to repos by setting `github_repo` field to "owner/repo" format

## 8. Roadmap Checklist

- [x] Phase 1: Core CRUD, search, dark mode, attention panel
- [x] Phase 2: GitHub sync, stale flag
- [x] Phase 3: Bookmarklet capture
- [ ] Phase 4: AI-assisted development and visual/design review
- [ ] Phase 5: Polish (Figma panel, reorder, deploy widgets)

## 9. Phase 4 Development Workflow

The three NVIDIA Build models are development tools for building this repository. They are not routed into the deployed dashboard and the dashboard does not require NVIDIA credentials to function.

- **DeepSeek V4 Flash** — primary implementation model for code changes, debugging, API work, and focused repository tasks.
- **Kimi K2.6** — visual/design model for screenshots, layout critique, interaction review, and visual direction.
- **Nemotron 3 Super** — architecture and verification model for planning, tradeoff review, test strategy, and final implementation audits.

Each model uses its own development-only API key so usage remains separately trackable. Keep those keys in Zo Secrets or the development environment used to invoke the models. Never add them to the dashboard's `.env.example`, browser bundle, deployed runtime, or source control.
