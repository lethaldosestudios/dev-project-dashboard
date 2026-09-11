// src/lib/auth.ts
/**
 * Cloudflare Access authentication helper.
 * 
 * In production (Cloudflare Workers with Access enabled), the `Cf-Access-User-Email`
 * header is injected by Cloudflare Access after successful authentication.
 * 
 * In local development (pnpm dev / pnpm preview), we bypass auth to allow
 * frictionless development since Access doesn't run locally.
 */

export async function requireAuth(request: Request): Promise<{ email: string } | Response> {
  // Dev bypass for local development: only bypass when explicitly not
  // production (pnpm dev / pnpm preview run without Cloudflare Access).
  if (process.env.NODE_ENV !== 'production') {
    return { email: 'local@dev' };
  }

  const email = request.headers.get('Cf-Access-User-Email');
  if (!email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return { email };
}