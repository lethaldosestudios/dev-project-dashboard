// src/lib/db.ts
// D1 client + query helpers for Cloudflare Workers runtime (Next.js on Cloudflare via @opennextjs/cloudflare)

import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
}

// Get D1 from the request context (for use in route handlers)
export function getDbFromRequest(req: Request): D1Database {
  // OpenNext injects the D1 binding on the request object
  // @ts-ignore - OpenNext runtime injection
  return (req as unknown as { env: Env }).env.DB;
}

// For use in server components, we need to pass the D1 binding through context
// This is a type helper for components that receive D1
export type DbContext = {
  db: D1Database;
};

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
