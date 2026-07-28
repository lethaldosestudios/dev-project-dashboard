// src/lib/db.ts
// D1 client + query helpers for Cloudflare Workers runtime (Next.js on Cloudflare via @cloudflare/next-on-pages)
import { getRequestContext } from "@cloudflare/next-on-pages";

export function getDb(): D1Database {
  const ctx = getRequestContext();
  return (ctx.env as { DB: D1Database }).DB;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
