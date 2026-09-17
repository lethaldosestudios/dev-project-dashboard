/**
 * @jest-environment node
 */
import { findDuplicateResource } from "./resources";

function recordingDb() {
  const statements: string[] = [];
  const db = {
    prepare: (sql: string) => {
      statements.push(sql);
      return { bind: () => ({ first: async () => null }) };
    },
  } as unknown as D1Database;
  return { db, statements };
}

test("scopes to the given project", async () => {
  const { db, statements } = recordingDb();

  await findDuplicateResource(db, "https://example.com/", "project-1");

  expect(statements[0]).toContain("project_id = ?");
});

test("scopes to unassigned resources when there is no project", async () => {
  const { db, statements } = recordingDb();

  await findDuplicateResource(db, "https://example.com/", null);

  expect(statements[0]).toContain("project_id IS NULL");
});
