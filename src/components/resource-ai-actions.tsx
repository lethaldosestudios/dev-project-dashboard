"use client";

import { useState } from "react";
import { LiquidButton } from "./ui/liquid-button";
import { GlassCard } from "./ui/glass-card";
import type { Resource } from "@/types";

type Analysis = { summary: string; tags: Array<{ name: string; confidence: number }>; content_type: string; actionability: string; next_action: string };
type Visual = { summary: string; findings: Array<{ title: string; detail: string; priority: "high" | "normal" | "low" }>; recommended_action: string };
type ApiPayload = { message?: string; run?: { result?: Analysis | Visual } };

export function ResourceAiActions({ resource }: { resource: Resource }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [visual, setVisual] = useState<Visual | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState<"analysis" | "visual" | null>(null);
  const [error, setError] = useState("");

  async function run(path: string, kind: "analysis" | "visual", body?: Record<string, string>) {
    setBusy(kind);
    setError("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const payload = await response.json() as ApiPayload;
      if (!response.ok || !payload.run?.result) throw new Error(payload.message || "AI action failed.");
      const result = payload.run.result;
      if (kind === "analysis") setAnalysis(result as Analysis);
      else setVisual(result as Visual);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "AI action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 border-t border-white/5 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <LiquidButton type="button" variant="secondary" size="sm" isLoading={busy === "analysis"} onClick={() => run(`/api/ai/resources/${resource.id}/analyze`, "analysis")}>
          Analyze with DeepSeek
        </LiquidButton>
        <LiquidButton type="button" variant="ghost" size="sm" isLoading={busy === "visual"} onClick={() => { const value = window.prompt("Paste an HTTPS image URL for Kimi to review.", imageUrl); if (value !== null) { setImageUrl(value.trim()); if (value.trim()) void run(`/api/ai/resources/${resource.id}/visual-analyze`, "visual", { imageUrl: value.trim() }); } }}>
          Visual review with Kimi
        </LiquidButton>
      </div>
      {error && <p className="mt-2 text-xs text-accent-red/90">{error}</p>}
      {analysis && <GlassCard variant="bordered" className="mt-3 p-3"><p className="text-xs uppercase tracking-[0.14em] text-accent-cyan">DeepSeek result</p><p className="mt-1 text-sm text-white/80">{analysis.summary}</p><div className="mt-2 flex flex-wrap gap-1.5">{analysis.tags.map((tag) => <span key={tag.name} className="rounded-full bg-accent-cyan/10 px-2 py-1 text-xs text-accent-cyan">{tag.name} · {Math.round(tag.confidence * 100)}%</span>)}</div><p className="mt-2 text-xs text-white/45">{analysis.content_type} · {analysis.actionability} · {analysis.next_action}</p></GlassCard>}
      {visual && <GlassCard variant="bordered" className="mt-3 p-3"><p className="text-xs uppercase tracking-[0.14em] text-accent-purple">Kimi visual result</p><p className="mt-1 text-sm text-white/80">{visual.summary}</p>{visual.findings.map((finding) => <div key={finding.title} className="mt-2"><p className="text-xs font-medium text-white">{finding.title} <span className="text-white/40">· {finding.priority}</span></p><p className="text-xs text-white/55">{finding.detail}</p></div>)}<p className="mt-2 text-xs text-white/45">{visual.recommended_action}</p></GlassCard>}
    </div>
  );
}
