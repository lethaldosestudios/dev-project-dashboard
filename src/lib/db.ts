// src/lib/db.ts
// D1 client + query helpers for Cloudflare Workers runtime (Next.js on Cloudflare via @cloudflare/next-on-pages)
import { getRequestContext } from "@cloudflare/next-on-pages";

export interface Env {
  DB: D1Database;
}

export function getDb(): D1Database {
  const ctx = getRequestContext<Env>();
  return ctx.env.DB;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
