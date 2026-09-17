// src/lib/resources.ts

/**
 * Resource dedupe rule, in one place so `/api/capture` and `/api/resources` cannot drift apart:
 *
 *   A URL may exist once per project, and once unassigned.
 *
 * A resource assigned to a project therefore only collides with resources in that same project,
 * and an unassigned resource only with other unassigned ones. The same link can be saved against
 * several projects, which is the intended behaviour.
 */
export async function findDuplicateResource(
  db: D1Database,
  normalizedUrl: string,
  projectId: string | null,
): Promise<{ id: string } | null> {
  const statement =
    projectId === null
      ? db
          .prepare("SELECT id FROM resources WHERE normalized_url = ? AND project_id IS NULL")
          .bind(normalizedUrl)
      : db
          .prepare("SELECT id FROM resources WHERE normalized_url = ? AND project_id = ?")
          .bind(normalizedUrl, projectId);

  return statement.first<{ id: string }>();
}
