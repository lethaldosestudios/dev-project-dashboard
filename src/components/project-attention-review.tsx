"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "./ui/glass-card";
import { LiquidButton } from "./ui/liquid-button";

type ReviewItem = { title: string; reason: string; source_ids: string[]; recommended_action: string };
type Review = { headline: string; priority: "high" | "normal" | "low"; items: ReviewItem[]; confidence: number };
type Run = { model?: string; status?: string; completed_at?: string; result?: Review; error_message?: string };
type ReviewPayload = { message?: string; run?: Run };

export function ProjectAttentionReview({ projectId }: { projectId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function review() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/ai/projects/${projectId}/review`, { method: "POST" });
      const payload = await response.json() as ReviewPayload;
      if (!response.ok || !payload.run) throw new Error(payload.message || "Project review failed.");
      setRun(payload.run);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Project review failed.");
    } finally {
      setBusy(false);
    }
  }

  const result = run?.result;
  return (
    <GlassCard variant="elevated" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent-cyan">Nemotron review</p>
          <h2 className="mt-1 text-lg font-medium text-white">What needs attention</h2>
          <p className="mt-1 text-sm text-white/45">A dated snapshot from your stored notes, resources, and activity.</p>
        </div>
        <LiquidButton type="button" variant="secondary" size="sm" onClick={review} isLoading={busy}>{run ? "Review again" : "Review attention"}</LiquidButton>
      </div>
      {run && <div className="mt-5 border-t border-white/5 pt-4"><div className="flex flex-wrap gap-2 text-xs text-white/35"><span>{run.model}</span><span>·</span><span>{run.status}</span>{run.completed_at && <><span>·</span><span>{new Date(run.completed_at).toLocaleString()}</span></>}</div>{result && <><div className="mt-3 flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs ${result.priority === "high" ? "bg-accent-red/15 text-accent-red" : result.priority === "normal" ? "bg-accent-cyan/15 text-accent-cyan" : "bg-white/10 text-white/55"}`}>{result.priority} priority</span><span className="text-xs text-white/35">confidence {Math.round(result.confidence * 100)}%</span></div><h3 className="mt-3 text-base font-medium text-white">{result.headline}</h3><div className="mt-3 space-y-3">{result.items.map((item) => <div key={`${item.title}-${item.source_ids.join("-")}`} className="rounded-xl border border-white/8 bg-black/15 p-3"><p className="font-medium text-white">{item.title}</p><p className="mt-1 text-sm text-white/60">{item.reason}</p><p className="mt-2 text-sm text-accent-emerald/80">Next: {item.recommended_action}</p>{item.source_ids.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{item.source_ids.map((sourceId) => <Link key={sourceId} href={`#source-${sourceId}`} className="text-xs text-accent-cyan/80 underline">Source {sourceId.slice(0, 8)}</Link>)}</div>}</div>)}</div>{result.items.length === 0 && <p className="mt-3 text-sm text-white/55">No concrete attention items found in the current project context.</p>}</>}</div>}
      {error && <p className="mt-4 text-sm text-accent-red/80">{error}</p>}
    </GlassCard>
  );
}
