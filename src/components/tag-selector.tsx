// src/components/tag-selector.tsx
"use client";

import { useEffect, useState } from "react";
import { GlowInput } from "./ui/glow-input";
import { LiquidButton } from "./ui/liquid-button";
import type { Tag } from "@/types";

interface TagSelectorProps {
  resourceId: string;
  initialTags?: Tag[];
}

export function TagSelector({ resourceId, initialTags }: TagSelectorProps) {
  const [assignedTags, setAssignedTags] = useState<Tag[]>(initialTags ?? []);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    await fetchAssignedTags();
    await fetchAllTags();
  }

  async function fetchAssignedTags() {
    try {
      const res = await fetch(`/api/resources/${resourceId}/tags`);
      if (res.ok) {
        const payload = (await res.json()) as { tags: Tag[] };
        setAssignedTags(payload.tags);
      }
    } catch {
      // leave existing tags in place
    }
  }

  async function fetchAllTags() {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const payload = (await res.json()) as { tags: Tag[] };
        setAllTags(payload.tags);
      }
    } catch {
      // leave existing tags in place
    }
  }

  useEffect(() => {
    fetchAssignedTags();
    fetchAllTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  const assignedIds = new Set(assignedTags.map((t) => t.id));

  async function handleAddTag() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const existing = allTags.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase() && !assignedIds.has(t.id),
    );

    setIsSaving(true);
    setError("");
    try {
      let tagId: string;

      if (existing) {
        tagId = existing.id;
      } else {
        const createRes = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        const createPayload = (await createRes.json().catch(() => ({}))) as {
          error?: string;
          tag?: { id: string };
        };
        if (!createRes.ok) throw new Error(createPayload.error || "Could not create tag.");
        tagId = createPayload.tag!.id;
      }

      const assignRes = await fetch(`/api/resources/${resourceId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      const assignPayload = (await assignRes.json().catch(() => ({}))) as { error?: string };
      if (!assignRes.ok) throw new Error(assignPayload.error || "Could not assign tag.");

      setInputValue("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add tag.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveTag(tagId: string) {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/resources/${resourceId}/tags/${tagId}`, {
        method: "DELETE",
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Could not remove tag.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove tag.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {assignedTags.map((tag) => (
          <span
            key={tag.id}
            className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full inline-flex items-center gap-1"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="text-accent-red/70 hover:text-accent-red focus:outline-none"
              aria-label={`Remove tag ${tag.name}`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <GlowInput
          placeholder="Type a tag name and press Add"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={200}
          glowColor="cyan"
        />
        <LiquidButton
          variant="secondary"
          size="sm"
          isLoading={isSaving}
          onClick={handleAddTag}
          disabled={isSaving || !inputValue.trim()}
        >
          Add
        </LiquidButton>
      </div>

      {allTags.length > 0 && !assignedTags.length && (
        <div className="flex flex-wrap gap-1">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                setInputValue(tag.name);
                handleAddTag();
              }}
              className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded-full hover:bg-white/10 hover:text-white/80 transition-colors"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  );
}
