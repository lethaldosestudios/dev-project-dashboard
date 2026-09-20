/**
 * @jest-environment node
 */
import { uniqueTagSlug } from "./tags";

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
  expect(await uniqueTagSlug(fakeDb([]), "My Tag")).toBe("my-tag");
});

test("appends -2 when the base slug is taken", async () => {
  expect(await uniqueTagSlug(fakeDb(["my-tag"]), "My Tag")).toBe("my-tag-2");
});

test("skips past every taken suffix", async () => {
  expect(await uniqueTagSlug(fakeDb(["my-tag", "my-tag-2"]), "My Tag")).toBe("my-tag-3");
});

test("returns the base when only a longer, unrelated slug matches the prefix", async () => {
  expect(await uniqueTagSlug(fakeDb(["my-tag-old"]), "My Tag")).toBe("my-tag");
});

test("falls back to 'tag' when the name slugifies to nothing", async () => {
  expect(await uniqueTagSlug(fakeDb([]), "···")).toBe("tag");
});
