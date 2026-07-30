"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "./ui/glass-card";
import { GlowInput } from "./ui/glow-input";
import { LiquidButton } from "./ui/liquid-button";

interface ResourceDialogProps {
  projectId: string;
  trigger: ReactNode;
}

export function ResourceDialog({ projectId, trigger }: ResourceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUrl("");
    setTitle("");
    setNote("");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedUrl = url.trim();
    try {
      const parsed = new URL(trimmedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      setError("Enter a valid http or https URL.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          url: trimmedUrl,
          title: title.trim() || null,
          note: note.trim() || null,
          savedVia: "manual",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save resource.");
      setOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save resource.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <GlassCard
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-dialog-title"
            className="w-full max-w-lg border-white/15 bg-black/90 shadow-2xl"
            hoverEffect={false}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-accent-cyan">Resource capture</p>
                <h2 id="resource-dialog-title" className="mt-1 text-xl font-semibold text-white">Add resource</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-white/40 transition-colors hover:text-white"
                aria-label="Close resource dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm text-white/70">
                URL
                <GlowInput
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com/reference"
                  maxLength={2000}
                  autoFocus
                  className="mt-2"
                />
              </label>
              <label className="block text-sm text-white/70">
                Title <span className="text-white/30">(optional)</span>
                <GlowInput
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="A useful title"
                  maxLength={240}
                  className="mt-2"
                />
              </label>
              <label className="block text-sm text-white/70">
                Note <span className="text-white/30">(optional)</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Why is this useful?"
                  maxLength={2000}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-glass-900/50 p-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-cyan/50 focus:shadow-glow-cyan"
                />
              </label>
              {error && <p className="text-sm text-accent-red">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <LiquidButton type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </LiquidButton>
                <LiquidButton type="submit" variant="primary" size="sm" isLoading={isSaving}>
                  Save resource
                </LiquidButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </>
  );
}
