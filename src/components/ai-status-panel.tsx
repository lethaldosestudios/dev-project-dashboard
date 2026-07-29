"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "./ui/glass-card";

type Status = { baseUrl: string; primaryModel: string; multimodalModel: string; reasoningModel: string; keyConfigured: boolean };
type Run = { status?: string; model?: string; created_at?: string; error_code?: string | null };
type StatusPayload = { ai?: Status };
type RunsPayload = { runs?: Run[] };

export function AiStatusPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/ai/status", { headers: { Accept: "application/json" } }),
      fetch("/api/ai/runs?limit=20", { headers: { Accept: "application/json" } }),
    ])
      .then(async ([statusResponse, runsResponse]) => {
        if (!statusResponse.ok || !runsResponse.ok) throw new Error("AI status unavailable.");
        const statusPayload = await statusResponse.json() as StatusPayload;
        const runsPayload = await runsResponse.json() as RunsPayload;
        if (!statusPayload.ai) throw new Error("AI status unavailable.");
        setStatus(statusPayload.ai);
        setRuns(runsPayload.runs || []);
      })
      .catch((statusError) => setError(statusError instanceof Error ? statusError.message : "AI status unavailable."));
  }, []);

  const latest = runs[0];
  const providerErrors = runs.filter((run) => run.status === "failed" || run.status === "rate_limited").length;

  return (
    <GlassCard variant="elevated" className="p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-accent-cyan">AI provider</p>
      <h2 className="mt-1 text-lg font-medium text-white">NVIDIA Build</h2>
      {status && <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4"><span className="text-white/45">API key</span><span className={status.keyConfigured ? "text-accent-emerald" : "text-accent-orange"}>{status.keyConfigured ? "Configured" : "Not configured"}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-white/45">Base URL</span><span className="truncate text-right text-white/65">{status.baseUrl}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-white/45">Latest run</span><span className="text-white/65">{latest ? `${latest.status} · ${latest.model}` : "No runs yet"}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="text-white/45">Recent provider errors</span><span className={providerErrors ? "text-accent-orange" : "text-accent-emerald"}>{providerErrors} / {runs.length}</span></div>
        <div className="border-t border-white/5 pt-3"><p className="text-xs text-white/35">Routing</p><p className="mt-1 text-xs text-white/60">DeepSeek · {status.primaryModel}</p><p className="mt-1 text-xs text-white/60">Kimi · {status.multimodalModel}</p><p className="mt-1 text-xs text-white/60">Nemotron · {status.reasoningModel}</p></div>
      </div>}
      {!status && !error && <p className="mt-4 text-sm text-white/40">Loading provider status…</p>}
      {error && <p className="mt-4 text-sm text-accent-red/80">{error}</p>}
    </GlassCard>
  );
}
