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

export function normalizeGithubRepo(input: string | null | undefined): string | null {
  if (!input) return null;
  let str = input.trim();
  if (!str) return null;

  // Strip protocol and domain if full URL is passed
  str = str.replace(/^https?:\/\//i, "").replace(/^github\.com\//i, "");

  // Remove trailing slashes or .git suffix
  str = str.replace(/\/$/, "").replace(/\.git$/i, "");

  return str || null;
}
