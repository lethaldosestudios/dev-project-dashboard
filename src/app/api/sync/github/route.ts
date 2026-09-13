import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, newId, nowIso } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  fetchUserRepos, fetchRepoEvents, extractActivityFromEvents,
  getRepoLastActivity,
} from "@/lib/github";
import type { SyncResult } from "@/types";

const GITHUB_TOKEN_HEADER = "x-github-token";

async function resolveGitHubToken(req: Request): Promise<string | null> {
  const headerToken = req.headers.get(GITHUB_TOKEN_HEADER);
  if (headerToken) return headerToken;
  const ctx = await getCloudflareContext({ async: true });
  const env = ctx.env as { GITHUB_TOKEN?: string };
  return env.GITHUB_TOKEN ?? null;
}

/**
 * Sync GitHub activity for all user repos and update project last_activity_at and repo_metadata
 */
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const token = await resolveGitHubToken(req);
  if (!token) {
    return NextResponse.json(
      { error: "GitHub token not configured. Set GITHUB_TOKEN via wrangler secret put (prod) or .dev.vars (local)." },
      { status: 401 }
    );
  }
  
  const db = await getDb();
  const syncRunId = newId();
  const startedAt = nowIso();
  let recordsProcessed = 0;
  const errors: string[] = [];

  // Record sync start
  await db
    .prepare(
      `INSERT INTO sync_runs (id, sync_type, status, started_at, records_processed)
       VALUES (?, 'github', 'started', ?, 0)`
    )
    .bind(syncRunId, startedAt)
    .run();

  try {
    // Step 1: Fetch all user repositories
    const repos = await fetchUserRepos(token);
    
    // Step 2: For each repo, match to projects in DB by github_repo and update activity & metadata
    for (const repo of repos) {
      try {
        if (repo.archived) continue;

        // Query projects table for repos with matching github_repo
        const project = await db
          .prepare("SELECT id FROM projects WHERE github_repo = ?")
          .bind(repo.full_name)
          .first<{ id: string }>();

        if (!project) {
          continue; // No project linked to this repo
        }

        const projectId = project.id;

        // Build metadata display string (e.g., "⭐ 42 · 🐛 3 · TypeScript")
        const metadataParts: string[] = [];
        metadataParts.push(`⭐ ${repo.stargazers_count}`);
        metadataParts.push(`🐛 ${repo.open_issues_count}`);
        if (repo.language) {
          metadataParts.push(repo.language);
        }
        const repoMetadataStr = metadataParts.join(" · ");

        // Fetch recent events for this repo
        const [owner, repoName] = repo.full_name.split("/");
        const events = await fetchRepoEvents(token, owner, repoName, 30);
        
        // Extract activity from events
        const activities = extractActivityFromEvents(events);
        
        // Save each activity to the database
        for (const activity of activities) {
          const existing = await db
            .prepare("SELECT id FROM github_activity WHERE external_id = ?")
            .bind(activity.external_id)
            .first();

          if (!existing) {
            await db
              .prepare(
                `INSERT INTO github_activity 
                 (id, project_id, event_type, external_id, commit_sha, title, author, url, occurred_at, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(
                newId(),
                projectId,
                activity.event_type,
                activity.external_id,
                activity.commit_sha ?? null,
                activity.title ?? null,
                activity.author ?? null,
                activity.url ?? null,
                activity.occurred_at,
                nowIso()
              )
              .run();
            recordsProcessed++;
          }
        }

        // Update project last_activity_at & repo_metadata
        const lastActivity = getRepoLastActivity(repo);
        const lastActivityIso = lastActivity ? lastActivity.toISOString() : null;

        await db
          .prepare(
            `UPDATE projects
             SET repo_metadata = ?,
                 last_activity_at = COALESCE(?, last_activity_at),
                 updated_at = ?
             WHERE id = ?`
          )
          .bind(repoMetadataStr, lastActivityIso, nowIso(), projectId)
          .run();

      } catch (repoError) {
        errors.push(`Error syncing ${repo.full_name}: ${repoError instanceof Error ? repoError.message : String(repoError)}`);
      }
    }

    // Step 3: Mark sync as completed
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
      skipped: 0,
      errors: errors.length > 0 ? errors : undefined,
      syncRun: {
        id: syncRunId,
        sync_type: "github",
        status: "completed",
        started_at: startedAt,
        completed_at: completedAt,
        records_processed: recordsProcessed,
      },
    };

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
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
      skipped: 0,
      errors: [errorMessage, ...errors],
      syncRun: {
        id: syncRunId,
        sync_type: "github",
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
 * GET sync status and history
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const db = await getDb();
  
  const { results: syncRuns } = await db
    .prepare("SELECT * FROM sync_runs WHERE sync_type = 'github' ORDER BY started_at DESC LIMIT 20")
    .all();

  return NextResponse.json({ syncRuns });
}
