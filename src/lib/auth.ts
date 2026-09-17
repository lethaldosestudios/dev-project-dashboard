// src/lib/auth.ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Cloudflare Access authentication helper.
 *
 * In production, Cloudflare Access injects a `Cf-Access-User-Email` header after authenticating a
 * request. That header is the only accepted proof of identity, and it is checked first, so a
 * deployed Worker behind Access never reaches the local bypass below.
 *
 * Locally, Access does not run, so there is nothing to validate. Setting `DEV_AUTH_BYPASS=true`
 * in `.dev.vars` opts in to a bypass for `pnpm dev` / `pnpm preview`. `.dev.vars` is gitignored
 * and is never deployed, so a production Worker cannot inherit the flag — and if the Cloudflare
 * context is unavailable at all, this fails closed.
 */

export const DEV_BYPASS_EMAIL = "local@dev";

async function isDevBypassEnabled(): Promise<boolean> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx.env as { DEV_AUTH_BYPASS?: string }).DEV_AUTH_BYPASS === "true";
  } catch {
    // No Cloudflare context (Jest, or an unexpected runtime) — fail closed.
    return false;
  }
}

export async function requireAuth(request: Request): Promise<{ email: string } | Response> {
  const email = request.headers.get("Cf-Access-User-Email");
  if (email) {
    return { email };
  }

  if (await isDevBypassEnabled()) {
    return { email: DEV_BYPASS_EMAIL };
  }

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
