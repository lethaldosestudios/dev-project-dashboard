/**
 * @jest-environment node
 */
import { uniqueProjectSlug } from "./projects";

function fakeDb(existingSlugs: string[]): D1Database {
  return {
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: existingSlugs.map((slug) => ({ slug })) }),
      }),
    }),
  } as unknown as D1Database;
}

test("slugifies the name when nothing collides", async () => {
  expect(await uniqueProjectSlug(fakeDb([]), "My Project")).toBe("my-project");
});

test("appends -2 when the base slug is taken", async () => {
  expect(await uniqueProjectSlug(fakeDb(["my-project"]), "My Project")).toBe("my-project-2");
});

test("skips past every taken suffix", async () => {
  expect(await uniqueProjectSlug(fakeDb(["my-project", "my-project-2"]), "My Project")).toBe(
    "my-project-3",
  );
});

test("returns the base when only a longer, unrelated slug matches the prefix", async () => {
  expect(await uniqueProjectSlug(fakeDb(["my-project-old"]), "My Project")).toBe("my-project");
});

test("falls back to 'project' when the name slugifies to nothing", async () => {
  expect(await uniqueProjectSlug(fakeDb([]), "···")).toBe("project");
});
