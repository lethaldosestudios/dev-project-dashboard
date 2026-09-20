// src/components/notes-editor.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "./ui/glass-card";
import { LiquidButton } from "./ui/liquid-button";
import { GlowInput } from "./ui/glow-input";
import type { Note } from "@/types";

interface NotesEditorProps {
  projectId: string;
  notes: Note[];
}

export function NotesEditor({ projectId, notes }: NotesEditorProps) {
  const router = useRouter();
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: newNoteTitle.trim() || null,
          content_md: newNoteContent,
          note_type: "general",
        }),
      });

      if (response.ok) {
        setNewNoteTitle("");
        setNewNoteContent("");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (notes.length === 0 && !newNoteContent && !newNoteTitle) {
    return (
      <GlassCard variant="bordered" className="p-6">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">📝</div>
          <p className="text-white/60 text-sm">No notes yet</p>
        </div>

        <div className="space-y-4">
          <GlowInput
            placeholder="Title (optional)"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            glowColor="cyan"
          />
          <textarea
            className="w-full min-h-[150px] bg-glass-900/50 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-accent-primary/50 focus:shadow-glow-blue/50"
            placeholder="Start writing your note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
          />
          <LiquidButton
            variant="primary"
            onClick={handleAddNote}
            disabled={isSubmitting || !newNoteContent.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Add Note"}
          </LiquidButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <GlassCard variant="elevated" className="p-6">
        <div className="space-y-4">
          <GlowInput
            placeholder="Title (optional)"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            glowColor="cyan"
          />
          <textarea
            className="w-full min-h-[120px] bg-glass-900/50 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-accent-primary/50 focus:shadow-glow-blue/50"
            placeholder="Add a note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
          />
          <LiquidButton
            variant="primary"
            onClick={handleAddNote}
            disabled={isSubmitting || !newNoteContent.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Add Note"}
          </LiquidButton>
        </div>
      </GlassCard>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            isExpanded={expandedNotes.has(note.id)}
            onToggleExpand={() => toggleExpand(note.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NoteItem({ note, isExpanded, onToggleExpand }: { note: Note; isExpanded: boolean; onToggleExpand: () => void }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title ?? "");
  const [editContent, setEditContent] = useState(note.content_md);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleSave = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          content_md: editContent,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save note.");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save note.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not delete note.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete note.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <GlassCard
      variant="elevated"
      className="p-4 hover:border-white/20 transition-all"
    >
      {isEditing ? (
        <div className="space-y-4">
          <GlowInput
            placeholder="Title (optional)"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={500}
            glowColor="cyan"
          />
          <textarea
            className="w-full min-h-[120px] bg-glass-900/50 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-accent-primary/50 focus:shadow-glow-blue/50"
            placeholder="Edit your note..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={50000}
          />
          {error && <p className="text-sm text-accent-red">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <LiquidButton variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </LiquidButton>
            <LiquidButton variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
              Save
            </LiquidButton>
          </div>
        </div>
      ) : (
        <>
          <div
            className="flex justify-between items-start"
            onClick={onToggleExpand}
            style={{ cursor: "pointer" }}
          >
            <div className="flex-1">
              {note.title && (
                <h4 className="font-medium text-white mb-1">{note.title}</h4>
              )}
              <div className={`prose prose-invert text-sm max-w-none ${isExpanded ? "line-clamp-none" : "line-clamp-2"}`}>
                <p className="whitespace-pre-wrap text-white/80">{note.content_md}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-white/50">{formatDate(note.updated_at)}</p>
            <div className="flex items-center gap-2">
              <LiquidButton variant="ghost" size="sm" onClick={() => {
                setEditTitle(note.title ?? "");
                setEditContent(note.content_md);
                setError("");
                setIsEditing(true);
              }}>
                Edit
              </LiquidButton>
              <LiquidButton variant="ghost" size="sm" isLoading={isDeleting} onClick={handleDelete}>
                Delete
              </LiquidButton>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="text-xs text-accent-primary/70 hover:text-accent-primary"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-accent-red mt-2">{error}</p>}
        </>
      )}
    </GlassCard>
  );
}
