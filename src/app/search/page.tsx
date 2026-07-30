// src/app/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowInput } from "@/components/ui/glow-input";

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
    <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Search</h1>
        <GlowInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, notes, and resources..."
          glowColor="purple"
          className="w-full max-w-2xl"
        />
      </div>

      {isSearching && (
        <GlassCard variant="bordered" className="text-center py-8">
          <div className="animate-spin text-2xl mb-2">🔍</div>
          <p className="text-white/60">Searching...</p>
        </GlassCard>
      )}

      {results.length === 0 && !isSearching && query && (
        <GlassCard variant="bordered" className="text-center py-8">
          <div className="text-2xl mb-2">🤔</div>
          <p className="text-white/60">No results found for "{query}"</p>
        </GlassCard>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">
            Results ({results.length})
          </h2>
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
  const typeConfig = {
    project: {
      icon: "📊",
      label: "Project",
      href: `/projects/${result.slug}`,
      title: result.name,
      subtitle: result.slug,
    },
    note: {
      icon: "📝",
      label: "Note",
      href: `/projects/${result.project_id}`,
      title: result.title || "Untitled note",
      subtitle: result.project_id,
    },
    resource: {
      icon: "🔗",
      label: "Resource",
      href: result.url || `/projects/${result.project_id}`,
      title: result.title || result.url || "Untitled resource",
      subtitle: result.url,
    },
  };

  const config = typeConfig[result.type];

  return (
    <GlassCard 
      variant="elevated" 
      className="p-4 hover:border-white/20 transition-all"
    >
      <Link href={config.href} className="block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{config.icon}</span>
            <div>
              <div className="font-medium text-white">{config.title}</div>
              {config.subtitle && (
                <div className="text-xs text-white/50 truncate max-w-md">{config.subtitle}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">
              {config.label}
            </span>
            {result.url && (
              <span className="text-xs text-white/40">→</span>
            )}
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}
