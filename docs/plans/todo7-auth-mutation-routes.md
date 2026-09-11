# Session 1: Auth on Mutation Routes (TODO #7)

**Priority:** 🔴 CRITICAL | **Est. Time:** 2–3 hrs

---

## Prerequisites

- Cloudflare Access policy configured on the Workers route (email OTP, GitHub, or your IdP)
- Header `Cf-Access-User-Email` injected by Access on authenticated requests

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Central auth helper — extracts & validates `Cf-Access-User-Email` header |

---

## Files to Modify (6 API routes)

| Route | Methods to Protect |
|-------|-------------------|
| `src/app/api/projects/route.ts` | `POST` |
| `src/app/api/projects/[id]/route.ts` | `PATCH`, `DELETE` |
| `src/app/api/resources/route.ts` | `POST` |
| `src/app/api/resources/[id]/route.ts` | `PATCH`, `DELETE` |
| `src/app/api/notes/route.ts` | `POST` |
| `src/app/api/notes/[id]/route.ts` | `PATCH`, `DELETE` |

---

## Implementation Checklist

- [ ] Create `src/lib/auth.ts` with `requireAuth(request)` returning `{ email }` or `Response` (401)
- [ ] Import helper in each of the 6 route files
- [ ] Call `requireAuth(request)` at start of each mutation handler
- [ ] Return early with the 401 response if auth fails
- [ ] Verify `pnpm build` passes
- [ ] Test manually: `curl -X POST /api/projects` → 401; with Access session → 200/201
- [ ] Update TODO.md: mark #7 as **Complete** with date
- [ ] Commit: `feat(auth): protect mutation routes with Cloudflare Access`

---

## Auth Helper Specification (`src/lib/auth.ts`)

```typescript
// src/lib/auth.ts
export async function requireAuth(request: Request): Promise<{ email: string } | Response> {
  const email = request.headers.get('Cf-Access-User-Email');
  if (!email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return { email };
}
```

---

## Usage Pattern in Route Handlers

```typescript
// At top of each POST/PATCH/DELETE handler
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  // auth.email available for audit logging if needed
  // ... rest of handler
}
```

---

## Verification Steps

1. **Build check:** `pnpm build` — must pass with no TypeScript errors
2. **Unauthenticated test:** `curl -X POST http://localhost:3000/api/projects` → expect 401 JSON
3. **Authenticated test:** Access the route through Cloudflare Access (browser or `curl` with Access cookie/header) → expect 200/201

---

## Post-Completion

- Update `TODO.md`: move Issue #7 from "Open Issues" to "Resolved" with completion date
- Commit message: `feat(auth): protect mutation routes with Cloudflare Access`
- Push to `main`