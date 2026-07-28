// src/app/api/sync/deploys/route.ts
// Placeholder for deploy sync (Vercel, Cloudflare, etc.)
// For Phase 2, we'll focus on GitHub sync; deploys can be added later

import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import type { SyncResult } from "@/types";

export const runtime = "edge";

export async function POST() {
  const db = getDb();
  const syncRunId = newId();
  const startedAt = nowIso();

  // Record sync start
  await db
    .prepare(
      `INSERT INTO sync_runs (id, sync_type, status, started_at, records_processed)
       VALUES (?, 'deploys', 'started', ?, 0)`
    )
    .bind(syncRunId, startedAt)
    .run();

  // For now, just mark as completed - deploy sync will be implemented in a later phase
  const completedAt = nowIso();
  await db
    .prepare(
      `UPDATE sync_runs SET status = 'completed', completed_at = ?, records_processed = 0 WHERE id = ?`
    )
    .bind(completedAt, syncRunId)
    .run();

  const result: SyncResult = {
    ok: true,
    synced: 0,
    skipped: 0,
    syncRun: {
      id: syncRunId,
      sync_type: "deploys",
      status: "completed",
      started_at: startedAt,
      completed_at: completedAt,
      records_processed: 0,
    },
  };

  return NextResponse.json(result);
}
