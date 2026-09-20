// src/lib/tags.ts
import { slugify } from "./utils";

/**
 * Tag slugs are unique permlinks, mirroring the approach in `uniqueProjectSlug()`.
 * A new tag named "Work" gets slug "work"; if that already exists, the next gets
 * "work-2", then "work-3", and so on.
 */
export async function uniqueTagSlug(db: D1Database, name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "tag";

  const { results } = excludeId
    ? await db
        .prepare("SELECT slug FROM tags WHERE (slug = ? OR slug LIKE ?) AND id != ?")
        .bind(base, `${base}-%`, excludeId)
        .all<{ slug: string }>()
    : await db
        .prepare("SELECT slug FROM tags WHERE slug = ? OR slug LIKE ?")
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
