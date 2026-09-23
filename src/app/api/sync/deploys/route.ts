// src/app/api/sync/deploys/route.ts
// Cloudflare Worker deploy sync: fetches recent deployments for this Worker from
// the Cloudflare API, dedupes by deployment_id, and records a sync_runs row.
// Mirrors src/app/api/sync/github/route.ts.
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, newId, nowIso } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { fetchDeployments, deploymentId, MAX_DEPLOYMENTS } from "@/lib/cloudflare";
import type { SyncResult } from "@/types";

const CF_TOKEN_HEADER = "x-cf-token";
const CF_SOURCE = "cloudflare";

// D1 caps how many parameters a single statement may bind, so existence checks are chunked.
const EXISTENCE_CHUNK_SIZE = 50;

/**
 * Which of these deployment ids are already stored?
 *
 * One query per chunk instead of one per deployment: a per-row SELECT would be two D1 round
 * trips for every deployment on every sync. The placeholder list is built from the chunk length,
 * not from any request input, so no part of the SQL comes from user data.
 */
async function findExistingDeploymentIds(
  db: D1Database,
  deploymentIds: string[]
): Promise<Set<string>> {
  const found = new Set<string>();

  for (let start = 0; start < deploymentIds.length; start += EXISTENCE_CHUNK_SIZE) {
    const chunk = deploymentIds.slice(start, start + EXISTENCE_CHUNK_SIZE);
    const placeholders = chunk.map(() => "?").join(", ");

    const { results } = await db
      .prepare(`SELECT deployment_id FROM deployments WHERE deployment_id IN (${placeholders})`)
      .bind(...chunk)
      .all<{ deployment_id: string }>();

    for (const row of results) {
      found.add(row.deployment_id);
    }
  }

  return found;
}

interface CloudflareCreds {
  token: string;
  accountId: string;
  scriptName: string;
}

/**
 * Resolve Cloudflare credentials: an API token from the `x-cf-token` header first, falling
 * back to the `CF_API_TOKEN` Worker secret (like the GitHub token in sync/github/route.ts).
 * Account id and script name come from the Worker env; the script name defaults to the local
 * Worker name so it can be overridden for a renamed deployment.
 */
async function resolveCloudflareCreds(
  req: Request
): Promise<CloudflareCreds | Response> {
  const headerToken = req.headers.get(CF_TOKEN_HEADER);
  let token: string | null = headerToken;
  let accountId: string | undefined;
  let scriptName: string = "dev-project-dashboard";

  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx.env as {
      CF_API_TOKEN?: string;
      CF_ACCOUNT_ID?: string;
      CF_SCRIPT_NAME?: string;
    };
    if (!token) token = env.CF_API_TOKEN ?? null;
    accountId = env.CF_ACCOUNT_ID;
    if (env.CF_SCRIPT_NAME) scriptName = env.CF_SCRIPT_NAME;
  } catch {
    // No Cloudflare context available — fail closed like src/lib/auth.ts.
  }

  if (!token || !accountId) {
    return NextResponse.json(
      {
        error:
          "Cloudflare credentials not configured. Set CF_API_TOKEN and CF_ACCOUNT_ID via `wrangler secret put` (prod) or in `.dev.vars` (local).",
      },
      { status: 401 }
    );
  }

  return { token, accountId, scriptName };
}

/**
 * Sync Cloudflare Worker deployments and record the run.
 */
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const creds = await resolveCloudflareCreds(req);
  if (creds instanceof Response) return creds;

  const db = await getDb();
  const syncRunId = newId();
  const startedAt = nowIso();
  let recordsProcessed = 0;
  let recordsSkipped = 0;

  // Record sync start
  await db
    .prepare(
      `INSERT INTO sync_runs (id, sync_type, status, started_at, records_processed)
       VALUES (?, 'deploys', 'started', ?, 0)`
    )
    .bind(syncRunId, startedAt)
    .run();

  try {
    // Fetch recent deployments, capped to bound Worker CPU/subrequest cost.
    const deployments = (await fetchDeployments(
      creds.token,
      creds.accountId,
      creds.scriptName
    )).slice(0, MAX_DEPLOYMENTS);

    const allIds = deployments.map(deploymentId);

    // One existence check for the whole batch, then only insert what is genuinely new.
    const alreadyStored = await findExistingDeploymentIds(db, allIds);
    const newDeployments = deployments.filter(
      (d) => !alreadyStored.has(deploymentId(d))
    );
    recordsSkipped += deployments.length - newDeployments.length;

    if (newDeployments.length > 0) {
      await db.batch(
        newDeployments.map((d) => {
          const version = d.versions?.[0];
          return db
            .prepare(
              `INSERT INTO deployments
               (id, sync_run_id, source, deployment_id, author_email, created_on, strategy, version_id, percentage)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              newId(),
              syncRunId,
              CF_SOURCE,
              deploymentId(d),
              d.author_email ?? null,
              d.created_on ?? null,
              d.strategy ?? null,
              version?.version_id ?? null,
              version?.percentage ?? null,
              nowIso()
            );
        })
      );
      recordsProcessed += newDeployments.length;
    }

    // Mark sync as completed
    const completedAt = nowIso();
    await db
      .prepare(
        `UPDATE sync_runs SET status = 'completed', completed_at = ?, records_processed = ? WHERE id = ?`
      )
      .bind(completedAt, recordsProcessed, syncRunId)
      .run();

    const result: SyncResult = {
      ok: true,
      synced: recordsProcessed,
      skipped: recordsSkipped,
      syncRun: {
        id: syncRunId,
        sync_type: "deploys",
        status: "completed",
        started_at: startedAt,
        completed_at: completedAt,
        records_processed: recordsProcessed,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Update sync run with failure
    await db
      .prepare(
        `UPDATE sync_runs SET status = 'failed', completed_at = ?, error_message = ? WHERE id = ?`
      )
      .bind(nowIso(), errorMessage, syncRunId)
      .run();

    const result: SyncResult = {
      ok: false,
      synced: recordsProcessed,
      skipped: recordsSkipped,
      errors: [errorMessage],
      syncRun: {
        id: syncRunId,
        sync_type: "deploys",
        status: "failed",
        started_at: startedAt,
        completed_at: nowIso(),
        records_processed: recordsProcessed,
        error_message: errorMessage,
      },
    };

    return NextResponse.json(result, { status: 500 });
  }
}

/**
 * GET deploy sync status and recent history.
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const db = await getDb();

  const { results: syncRuns } = await db
    .prepare(
      "SELECT id, sync_type, status, started_at, completed_at, records_processed, error_message FROM sync_runs WHERE sync_type = 'deploys' ORDER BY started_at DESC LIMIT 20"
    )
    .all();

  return NextResponse.json({ syncRuns });
}
