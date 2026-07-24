# Dev Project Dashboard

## 1. Mini PRD

**Problem**
Porter runs multiple active dev/design projects (Lethal Dose Studios, personal tools, client work) and currently tracks links, notes, and GitHub activity across scattered bookmarks and a Chrome extension (STACKFOLO) with no data ownership and no automation hooks.

**Goal**
A self-hosted, single-user dashboard that answers one question fast: *what needs my attention across my projects right now?* It replaces the Chrome-extension workflow with an owned, extendable system for capturing resources, notes, and activity per project.

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
- D1 schema + CRUD API routes
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
- Daily use replaces the old Chrome extension within 2 weeks of MVP deploy
- Capture flow takes under 10 seconds from any page
- $0–1/month infra cost maintained

**Future phases**
- Phase 2: GitHub sync + stale detection
- Phase 3: Bookmarklet quick capture
- Phase 4: AI tagging/summarization (NVIDIA Build API)
- Phase 5: Polish (widgets, Figma panel, reordering)

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Hosting | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Auth | Cloudflare Access (fallback: single-user password + session cookie) |
| GitHub Integration | GitHub REST/GraphQL API (PAT to start) |
| AI | NVIDIA Build API (Phase 4+) |
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
│   │   │   ├── sync/github/route.ts
│   │   │   └── sync/deploys/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # shadcn components
│   │   ├── project-card.tsx
│   │   ├── resource-list.tsx
│   │   ├── notes-editor.tsx
│   │   ├── search-bar.tsx
│   │   └── attention-panel.tsx
│   ├── lib/
│   │   ├── db.ts                   # D1 client helper
│   │   ├── github.ts
│   │   ├── search.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── db/
│   ├── schema.sql
│   └── migrations/
│       └── 0001_init.sql
├── public/
├── .env.example
├── wrangler.toml
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 4. Setup

```bash
pnpm install
pnpm dlx wrangler d1 create dev-project-dashboard-db
# copy resulting database_id into wrangler.toml
pnpm dlx wrangler d1 execute dev-project-dashboard-db --file=./db/schema.sql
pnpm dev
```

## 5. Deploy

```bash
pnpm build
pnpm dlx wrangler deploy
```

## 6. Roadmap Checklist

- [ ] Phase 1: Core CRUD, search, dark mode, attention panel
- [ ] Phase 2: GitHub sync, stale flag
- [ ] Phase 3: Bookmarklet capture
- [ ] Phase 4: AI tagging/summarization
- [ ] Phase 5: Polish (Figma panel, reorder, deploy widgets)
