// src/lib/utils.ts
// Query parameters that identify where a visit came from rather than which resource was visited.
// Stripped before comparison so tracking variants of the same page dedupe to one resource.
const TRACKING_PARAM_PREFIXES = ["utm_"];
const TRACKING_PARAMS = new Set(["fbclid", "gclid", "msclkid", "mc_eid", "igshid", "igsh"]);

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    TRACKING_PARAMS.has(lower) ||
    TRACKING_PARAM_PREFIXES.some((prefix) => lower.startsWith(prefix))
  );
}

export function normalizeUrl(input: string): string {
  try {
    const u = new URL(input);
    u.hash = "";

    const kept = [...u.searchParams.entries()].filter(([name]) => !isTrackingParam(name));
    u.search = "";
    for (const [name, value] of kept) {
      u.searchParams.append(name, value);
    }

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

// GitHub owner/repo names allow alphanumerics, hyphens, underscores, and dots.
const GITHUB_NAME_RE = /^[a-zA-Z0-9._-]+$/;

/**
 * Normalize a pasted GitHub repository reference to the canonical `owner/repo`
 * form expected by the sync lookup and the project detail header link.
 *
 * Accepts bare `owner/repo`, `https://github.com/owner/repo` (optionally with a
 * `www` subdomain, query string, fragment, leading `github.com/`, or a `.git`
 * suffix). Returns the canonical `owner/repo`string, or `null` if the input
 * cannot be reduced to exactly a GitHub owner and repository.
 */
export function normalizeGithubRepo(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let path = trimmed;

  // If a full URL is given, parse it so query/fragment/www/trailing-slash are
  // handled correctly. Reject any non-github.com host rather than guessing.
  if (/^https?:\/\//i.test(trimmed) || /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }
    const host = url.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") return null;
    path = url.pathname;
  } else if (/^github\.com\//i.test(trimmed)) {
    // e.g. "github.com/owner/repo" without a protocol
    path = trimmed.slice("github.com".length);
  }

  // Strip leading slashes, trailing slashes, and a trailing .git suffix.
  path = path.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\.git$/i, "");

  if (!path) return null;

  // A valid repo reference is exactly two path segments: owner/repo.
  const segments = path.split("/");
  if (segments.length !== 2) return null;

  const [owner, repo] = segments;
  if (!GITHUB_NAME_RE.test(owner) || !GITHUB_NAME_RE.test(repo)) return null;

  return `${owner}/${repo}`;
}
