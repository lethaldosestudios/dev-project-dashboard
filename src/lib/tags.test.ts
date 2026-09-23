/**
 * @jest-environment node
 */
import { uniqueTagSlug } from "./tags";

interface TagEntry {
  id: string;
  slug: string;
}

function fakeDb(entries: TagEntry[]): D1Database {
  return {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({
        all: async () => {
          // When uniqueTagSlug is called with an excludeId, the SQL contains
          // "id != ?" and the last bind arg is that id. Filter it out so the
          // mock simulates the real D1 behaviour.
          const excludedId =
            sql.includes("id != ?") && args.length >= 1
              ? (args[args.length - 1] as string)
              : null;
          const results = entries
            .filter((e) => e.id !== excludedId)
            .map((e) => ({ slug: e.slug }));
          return { results };
        },
      }),
    }),
  } as unknown as D1Database;
}

test("slugifies the name when nothing collides", async () => {
  expect(await uniqueTagSlug(fakeDb([]), "My Tag")).toBe("my-tag");
});

test("appends -2 when the base slug is taken", async () => {
  expect(await uniqueTagSlug(fakeDb([{ id: "t1", slug: "my-tag" }]), "My Tag")).toBe("my-tag-2");
});

test("skips past every taken suffix", async () => {
  expect(
    await uniqueTagSlug(
      fakeDb([
        { id: "t1", slug: "my-tag" },
        { id: "t2", slug: "my-tag-2" },
      ]),
      "My Tag",
    ),
  ).toBe("my-tag-3");
});

test("returns the base when only a longer, unrelated slug matches the prefix", async () => {
  expect(await uniqueTagSlug(fakeDb([{ id: "t1", slug: "my-tag-old" }]), "My Tag")).toBe("my-tag");
});

test("falls back to 'tag' when the name slugifies to nothing", async () => {
  expect(await uniqueTagSlug(fakeDb([]), "···")).toBe("tag");
});

test("excludes a given id from collision checks so a rename is not self-colliding", async () => {
  expect(await uniqueTagSlug(fakeDb([{ id: "current", slug: "my-tag" }]), "My Tag", "current")).toBe("my-tag");
});

test("still suffixes when another tag owns the base slug", async () => {
  expect(
    await uniqueTagSlug(
      fakeDb([
        { id: "t1", slug: "my-tag" },
        { id: "t2", slug: "my-tag-2" },
      ]),
      "My Tag",
      "current",
    ),
  ).toBe("my-tag-3");
});
