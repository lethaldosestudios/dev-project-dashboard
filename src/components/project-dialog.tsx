"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types";
import { GlassCard } from "./ui/glass-card";
import { GlowInput } from "./ui/glow-input";
import { LiquidButton } from "./ui/liquid-button";

interface ProjectDialogProps {
  mode: "create" | "edit";
  project?: Project;
  trigger: ReactNode;
}

export function ProjectDialog({ mode, project, trigger }: ProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [stack, setStack] = useState(project?.stack ?? "");
  const [priority, setPriority] = useState<Project["priority"]>(project?.priority ?? "normal");
  const [status, setStatus] = useState<Project["status"]>(project?.status ?? "active");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? "");
    setDescription(project?.description ?? "");
    setStack(project?.stack ?? "");
    setPriority(project?.priority ?? "normal");
    setStatus(project?.status ?? "active");
    setError("");
  }, [open, project]);

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

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(mode === "create" ? "/api/projects" : `/api/projects/${project?.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || null,
          stack: stack.trim() || null,
          priority,
          ...(mode === "edit" ? { status } : {}),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save project.");
      setOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save project.");
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
            aria-labelledby="project-dialog-title"
            className="w-full max-w-lg border-white/15 bg-black/90 shadow-2xl"
            hoverEffect={false}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-accent-cyan">Project workspace</p>
                <h2 id="project-dialog-title" className="mt-1 text-xl font-semibold text-white">
                  {mode === "create" ? "Create project" : "Edit project"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-white/40 transition-colors hover:text-white"
                aria-label="Close project dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm text-white/70">
                Name
                <GlowInput
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Dev Project Dashboard"
                  maxLength={120}
                  autoFocus
                  className="mt-2"
                />
              </label>

              <label className="block text-sm text-white/70">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is this project for?"
                  maxLength={1000}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-glass-900/50 p-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent-cyan/50 focus:shadow-glow-cyan"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Stack
                  <GlowInput
                    value={stack}
                    onChange={(event) => setStack(event.target.value)}
                    placeholder="Next.js, D1, TypeScript"
                    maxLength={240}
                    className="mt-2"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Priority
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as Project["priority"])}
                    className="mt-2 h-[52px] w-full rounded-xl border border-white/10 bg-glass-900/50 px-3 text-sm text-white outline-none focus:border-accent-cyan/50"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              {mode === "edit" && (
                <label className="block text-sm text-white/70">
                  Status
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as Project["status"])}
                    className="mt-2 h-[52px] w-full rounded-xl border border-white/10 bg-glass-900/50 px-3 text-sm text-white outline-none focus:border-accent-cyan/50"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              )}

              {error && <p className="text-sm text-accent-red">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <LiquidButton type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </LiquidButton>
                <LiquidButton type="submit" variant="primary" size="sm" isLoading={isSaving}>
                  {mode === "create" ? "Create project" : "Save changes"}
                </LiquidButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </>
  );
}
