// src/lib/cloudflare.ts
// Cloudflare REST client for fetching Worker deployment status.
// Mirrors the direct-fetch pattern in src/lib/github.ts — no SDK dependency,
// so the Worker bundle stays minimal and consistent with the GitHub client.

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

/** How many deployment records to keep per sync run. The deployments endpoint is
 * not reliably paginated in the v4 SDK, so we cap what we store to bound CPU/worker
 * cost, mirroring the GitHub sync's bounded fetch philosophy. */
export const MAX_DEPLOYMENTS = 30;

export interface CloudflareDeploymentVersion {
  version_id: string;
  percentage?: number;
}

export interface CloudflareDeployment {
  id: string;
  source?: string;
  author_email?: string;
  created_on?: string;
  strategy?: string;
  versions: CloudflareDeploymentVersion[];
}

function getHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Fetch recent Worker deployments for a script.
 *
 * The Cloudflare v4 deployments list returns `{ result: { deployments: [...] } }`,
 * but some API variants return the array under `result` directly. We unwrap
 * defensively so either shape works.
 */
export async function fetchDeployments(
  token: string,
  accountId: string,
  scriptName: string
): Promise<CloudflareDeployment[]> {
  const url = `${CF_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}/deployments`;
  const response = await fetch(url, { headers: getHeaders(token) });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as {
    success?: boolean;
    errors?: Array<{ code?: number; message?: string }>;
    result?: { deployments?: CloudflareDeployment[] } | CloudflareDeployment[];
  };

  if (data.success === false) {
    const msg = data.errors?.map((e) => e.message).join(", ") ?? "unknown error";
    throw new Error(`Cloudflare API error: ${msg}`);
  }

  const result = data.result;
  if (Array.isArray(result)) return result as CloudflareDeployment[];
  return result?.deployments ?? [];
}

/**
 * Stable external id for dedupe — the Cloudflare deployment id.
 * Stored in `deployments.deployment_id`, deduplicated across sync runs like
 * `github_activity.external_id`.
 */
export function deploymentId(deployment: CloudflareDeployment): string {
  return deployment.id;
}
