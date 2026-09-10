import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, newId, nowIso } from "@/lib/db";
import {
  fetchUserRepos, fetchRepoEvents, extractActivityFromEvents,
  getProjectIdForRepo, getRepoLastActivity,
} from "@/lib/github";
import type { SyncResult, SyncRun } from "@/types";

const GITHUB_TOKEN_HEADER = "x-github-token";

async function resolveGitHubToken(req: Request): Promise<string | null> {
const headerToken = req.headers.get(GITHUB_TOKEN_HEADER);
if (headerToken) return headerToken;
const ctx = await getCloudflareContext({ async: true });
const env = ctx.env as { GITHUB_TOKEN?: string };
return env.GITHUB_TOKEN ?? null;
}

/**
 * Sync GitHub activity for all user repos and update project last_activity_at
 */
export async function POST(req: Request) {
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
    
    // Step 2: For each repo, fetch recent events and update project activity
    for (const repo of repos) {
      try {
        // Skip archived repos
        if (repo.archived) continue;

        // Get project_id from repo full_name mapping
        // In production, this should query projects table for repos with matching github_repo
        let projectId = getProjectIdForRepo(repo.full_name);
        
        // If no project linked, skip but log
        if (!projectId) {
          // Try to find project by github_repo field in DB
          const project = await db
            .prepare("SELECT id FROM projects WHERE github_repo = ?")
            .bind(repo.full_name)
            .first();
          
          if (project) {
            projectId = project.id as string;
          } else {
            continue; // No project linked to this repo
          }
        }

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

        // Update project last_activity_at based on repo activity
        const lastActivity = getRepoLastActivity(repo);
        if (lastActivity) {
          await db
            .prepare(
              `UPDATE projects SET last_activity_at = ?, updated_at = ? WHERE id = ?`
            )
            .bind(lastActivity.toISOString(), nowIso(), projectId)
            .run();
        }

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
export async function GET() {
  const db = await getDb();
  
  const { results: syncRuns } = await db
    .prepare("SELECT * FROM sync_runs WHERE sync_type = 'github' ORDER BY started_at DESC LIMIT 20")
    .all();

  return NextResponse.json({ syncRuns });
  }
