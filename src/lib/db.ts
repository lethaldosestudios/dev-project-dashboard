// src/lib/db.ts
// Minimal D1 client helper for Cloudflare Workers runtime.
export interface Env {
  DB: D1Database;
}

export function getDb(env: Env) {
  return env.DB;
}
