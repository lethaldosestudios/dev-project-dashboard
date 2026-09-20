// src/components/project-link-dialog.tsx
"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectLink } from "@/types";
import { GlassCard } from "./ui/glass-card";
import { GlowInput } from "./ui/glow-input";
import { LiquidButton } from "./ui/liquid-button";

interface ProjectLinkDialogProps {
  projectId: string;
  trigger: ReactNode;
  link?: ProjectLink;
}

export function ProjectLinkDialog({ projectId, trigger, link }: ProjectLinkDialogProps) {
  const router = useRouter();
  const isEditing = Boolean(link);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(link?.type ?? "");
  const [label, setLabel] = useState(link?.label ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [sortOrder, setSortOrder] = useState(link?.sort_order ?? 0);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(link?.type ?? "");
    setLabel(link?.label ?? "");
    setUrl(link?.url ?? "");
    setSortOrder(link?.sort_order ?? 0);
    setError("");
  }, [open, link]);

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

    const trimmedType = type.trim();
    if (!trimmedType) {
      setError("Link type is required.");
      return;
    }

    const trimmedUrl = url.trim();
    try {
      const parsed = new URL(trimmedUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      setError("Enter a valid http or https URL.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        isEditing ? `/api/project-links/${link?.id}` : "/api/project-links",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            type: trimmedType,
            label: label.trim() || null,
            url: trimmedUrl,
            sort_order: sortOrder,
          }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || `Could not ${isEditing ? "update" : "save"} link.`);
      setOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `Could not ${isEditing ? "update" : "save"} link.`);
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
            aria-labelledby="link-dialog-title"
            className="w-full max-w-lg border-white/15 bg-black/90 shadow-2xl"
            hoverEffect={false}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-accent-cyan">Project link</p>
                <h2 id="link-dialog-title" className="mt-1 text-xl font-semibold text-white">
                  {isEditing ? "Edit link" : "Add link"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-white/40 transition-colors hover:text-white"
                aria-label="Close link dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm text-white/70">
                Type
                <GlowInput
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  placeholder="e.g. documentation, demo, deployment"
                  maxLength={50}
                  autoFocus
                  className="mt-2"
                />
              </label>

              <label className="block text-sm text-white/70">
                URL
                <GlowInput
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://..."
                  maxLength={2000}
                  className="mt-2"
                />
              </label>

              <label className="block text-sm text-white/70">
                Label <span className="text-white/30">(optional)</span>
                <GlowInput
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Display text (defaults to URL)"
                  maxLength={200}
                  className="mt-2"
                />
              </label>

              <label className="block text-sm text-white/70">
                Sort order
                <GlowInput
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(event) => setSortOrder(Number(event.target.value))}
                  className="mt-2"
                />
              </label>

              {error && <p className="text-sm text-accent-red">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <LiquidButton type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </LiquidButton>
                <LiquidButton type="submit" variant="primary" size="sm" isLoading={isSaving}>
                  {isEditing ? "Save changes" : "Save link"}
                </LiquidButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </>
  );
}
