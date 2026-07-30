"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Link2, Save, X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-button";
import { GlowInput } from "@/components/ui/glow-input";
import type { Project } from "@/types";

type CaptureResult = {
  id: string;
  duplicate?: boolean;
  projectId?: string | null;
};

export default function CapturePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [projectId, setProjectId] = useState("");
  const [source, setSource] = useState<"manual" | "bookmarklet">("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CaptureResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get("url") || "";
    const queryTitle = params.get("title") || "";
    const queryProjectId = params.get("projectId") || "";
    const querySource = params.get("source");

    setUrl(queryUrl);
    setTitle(queryTitle);
    setProjectId(queryProjectId);
    setSource(querySource === "bookmarklet" ? "bookmarklet" : "manual");

    fetch("/api/projects")
      .then(async (response) => {
        if (!response.ok) throw new Error("Projects could not be loaded.");
        const data = await response.json() as { projects?: Project[] };
        setProjects(data.projects || []);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Projects could not be loaded.");
      })
      .finally(() => setIsLoadingProjects(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      setError("Enter a complete URL starting with https:// or http://.");
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      setError("Only HTTP and HTTPS links can be captured.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: parsedUrl.toString(),
          title: title.trim() || parsedUrl.hostname,
          note: note.trim() || undefined,
          projectId: projectId || undefined,
          savedVia: source,
        }),
      });
      const data = await response.json() as {
        error?: string;
        duplicate?: boolean;
        id?: string;
        captured?: { id?: string };
      };

      if (!response.ok) {
        throw new Error(data.error || "Capture failed.");
      }

      setResult({ id: data.id || data.captured?.id || "", duplicate: data.duplicate, projectId: projectId || null });
      if (!data.duplicate) setNote("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Capture failed.");
    } finally {
      setIsLoading(false);
    }
  }

  const selectedProject = projects.find((project) => project.id === projectId);

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" aria-label="Back to dashboard" className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan mb-1">Phase 3</p>
          <h1 className="text-3xl font-bold text-white">Quick Capture</h1>
          <p className="text-white/50 text-sm mt-1">Save a useful link before it gets lost.</p>
        </div>
      </div>

      <GlassCard variant="elevated" className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="capture-url" className="block text-sm font-medium text-white/80 mb-2">URL</label>
            <GlowInput
              id="capture-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/article"
              required
              autoFocus={!url}
              glowColor="cyan"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="capture-title" className="block text-sm font-medium text-white/80 mb-2">Title</label>
            <GlowInput
              id="capture-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A useful reference"
              glowColor="purple"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="capture-project" className="block text-sm font-medium text-white/80 mb-2">Project</label>
            <select
              id="capture-project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              disabled={isLoadingProjects}
              className="glow-input w-full h-10 rounded-md px-3 text-sm text-white/90 bg-black/40 disabled:opacity-50"
            >
              <option value="" className="bg-black">Unassigned</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id} className="bg-black">
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="capture-note" className="block text-sm font-medium text-white/80 mb-2">Note <span className="text-white/40">(optional)</span></label>
            <textarea
              id="capture-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why this matters or what to revisit"
              rows={4}
              maxLength={5000}
              className="glow-input w-full rounded-md px-3 py-2 text-sm text-white/90 placeholder:text-white/30 resize-y"
            />
            <p className="text-xs text-white/30 mt-1 text-right">{note.length}/5000</p>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-3 text-sm text-accent-red">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div role="status" className="rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-3 text-sm text-accent-emerald">
              <div className="flex items-start gap-2">
                {result.duplicate ? <Link2 className="w-4 h-4 mt-0.5 shrink-0" /> : <Check className="w-4 h-4 mt-0.5 shrink-0" />}
                <span>{result.duplicate ? "This link is already captured." : "Link captured."}</span>
              </div>
              {selectedProject && (
                <Link href={`/projects/${selectedProject.slug}`} className="inline-flex items-center gap-1 mt-2 text-xs text-white/80 hover:text-white">
                  Open {selectedProject.name}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-xs text-white/35">Saved via {source}</span>
            <LiquidButton type="submit" variant="primary" size="md" isLoading={isLoading} leftIcon={<Save className="w-4 h-4" />}>
              Capture link
            </LiquidButton>
          </div>
        </form>
      </GlassCard>
    </main>
  );
}
