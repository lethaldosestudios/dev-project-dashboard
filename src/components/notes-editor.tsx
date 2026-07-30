// src/components/notes-editor.tsx
"use client";

import { useState } from "react";
import { GlassCard } from "./ui/glass-card";
import { LiquidButton } from "./ui/liquid-button";
import { GlowInput } from "./ui/glow-input";
import type { Note } from "@/types";

interface NotesEditorProps {
  projectId: string;
  notes: Note[];
}

export function NotesEditor({ projectId, notes }: NotesEditorProps) {
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
        // In a real app, you'd refresh the notes list here
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <GlassCard 
      variant="elevated" 
      className="p-4 cursor-pointer hover:border-white/20 transition-all"
      onClick={onToggleExpand}
    >
      <div className="flex justify-between items-start">
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
    </GlassCard>
  );
}
