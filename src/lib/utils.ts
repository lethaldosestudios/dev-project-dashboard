// src/lib/utils.ts
export function normalizeUrl(input: string): string {
  try {
    const u = new URL(input);
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return input.trim();
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}
