// src/app/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";

interface SearchResult {
  id: string;
  type: "project" | "note" | "resource";
  name?: string;
  slug?: string;
  title?: string;
  url?: string;
  project_id?: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const search = async (q: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await response.json() as SearchResponse;
      setResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Search</h1>
        <SearchBar
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, notes, and resources..."
        />
      </div>

      {isSearching && (
        <p className="text-sm text-neutral-400">Searching...</p>
      )}

      {results.length === 0 && !isSearching && query && (
        <p className="text-sm text-neutral-400">No results found for "{query}"</p>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Results ({results.length})</h2>
          <div className="space-y-3">
            {results.map((result) => (
              <ResultItem key={`${result.type}-${result.id}`} result={result} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function ResultItem({ result }: { result: SearchResult }) {
  switch (result.type) {
    case "project":
      return (
        <Link
          href={`/projects/${result.slug}`}
          className="block rounded-lg border border-neutral-800 p-4 hover:border-neutral-600 transition-colors"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-medium">Project: {result.name}</span>
            <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full ml-auto">
              project
            </span>
          </div>
        </Link>
      );
    case "note":
      return (
        <Link
          href={`/projects/${result.project_id}`}
          className="block rounded-lg border border-neutral-800 p-4 hover:border-neutral-600 transition-colors"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{result.title || "Untitled note"}</span>
            <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full ml-auto">
              note
            </span>
          </div>
        </Link>
      );
    case "resource":
      return (
        <Link
          href={result.url || `/projects/${result.project_id}`}
          target={result.url ? "_blank" : "_self"}
          rel={result.url ? "noopener noreferrer" : undefined}
          className="block rounded-lg border border-neutral-800 p-4 hover:border-neutral-600 transition-colors"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{result.title || result.url || "Untitled resource"}</span>
            <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full ml-auto">
              resource
            </span>
          </div>
          {result.url && (
            <p className="text-sm text-neutral-400 mt-1 truncate">{result.url}</p>
          )}
        </Link>
      );
    default:
      return null;
  }
}
