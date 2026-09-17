/**
 * @jest-environment node
 */
import { normalizeUrl } from "./utils";

test("strips the fragment and a trailing slash", () => {
  expect(normalizeUrl("https://example.com/docs/#section")).toBe("https://example.com/docs");
});

test("strips utm_* parameters", () => {
  expect(normalizeUrl("https://example.com/post?utm_source=news&utm_medium=email&id=7")).toBe(
    "https://example.com/post?id=7",
  );
});

test("strips known click identifiers", () => {
  expect(normalizeUrl("https://example.com/post?fbclid=abc&page=2")).toBe(
    "https://example.com/post?page=2",
  );
});

test("keeps meaningful query parameters", () => {
  expect(normalizeUrl("https://example.com/search?q=d1&page=3")).toBe(
    "https://example.com/search?q=d1&page=3",
  );
});

test("treats tracking variants of the same page as equal", () => {
  expect(normalizeUrl("https://example.com/post?utm_source=twitter")).toBe(
    normalizeUrl("https://example.com/post"),
  );
});

test("returns trimmed input for an unparseable URL", () => {
  expect(normalizeUrl("  not a url  ")).toBe("not a url");
});
