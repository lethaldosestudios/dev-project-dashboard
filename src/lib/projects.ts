// src/lib/projects.ts
import { slugify } from "./utils";

/**
 * Project slugs are stable permalinks: they are assigned once at creation and never rewritten on
 * rename, so links that already point at `/projects/<slug>` keep working.
 *
 * Because `projects.slug` is UNIQUE, a new project must not collide with an existing one. This
 * returns the first free slug for a name — `foo`, then `foo-2`, `foo-3`, …
 */
export async function uniqueProjectSlug(db: D1Database, name: string): Promise<string> {
  const base = slugify(name) || "project";

  const { results } = await db
    .prepare("SELECT slug FROM projects WHERE slug = ? OR slug LIKE ?")
    .bind(base, `${base}-%`)
    .all<{ slug: string }>();

  const taken = new Set(results.map((row) => row.slug));
  if (!taken.has(base)) {
    return base;
  }

  for (let suffix = 2; suffix <= 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}
