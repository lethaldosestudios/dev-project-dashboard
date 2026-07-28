// src/components/notes-editor.tsx
"use client";

import { useState } from "react";
import type { Note } from "@/types";

interface NotesEditorProps {
  projectId: string;
  notes: Note[];
}

export function NotesEditor({ projectId, notes }: NotesEditorProps) {
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          content_md: newNoteContent,
          note_type: "general",
        }),
      });

      if (response.ok) {
        setNewNoteContent("");
        // In a real app, you'd refresh the notes list here
        // For now, we'll just clear the input
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (notes.length === 0 && !newNoteContent) {
    return (
      <div className="rounded-lg border border-neutral-800 p-4">
        <textarea
          className="w-full min-h-[200px] bg-neutral-900 border border-neutral-700 rounded-md p-3 text-sm resize-none focus:outline-none focus:border-neutral-600"
          placeholder="Add a note..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
        />
        <button
          onClick={handleAddNote}
          disabled={isSubmitting || !newNoteContent.trim()}
          className="mt-3 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
        >
          {isSubmitting ? "Saving..." : "Add Note"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} />
      ))}
      
      <div className="rounded-lg border border-neutral-800 p-4">
        <textarea
          className="w-full min-h-[150px] bg-neutral-900 border border-neutral-700 rounded-md p-3 text-sm resize-none focus:outline-none focus:border-neutral-600"
          placeholder="Add a note..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
        />
        <button
          onClick={handleAddNote}
          disabled={isSubmitting || !newNoteContent.trim()}
          className="mt-3 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
        >
          {isSubmitting ? "Saving..." : "Add Note"}
        </button>
      </div>
    </div>
  );
}

function NoteItem({ note }: { note: Note }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {note.title && (
            <h4 className="font-medium text-sm mb-2">{note.title}</h4>
          )}
          <div className="prose prose-invert text-sm max-w-none">
            <p className="whitespace-pre-wrap">{note.content_md}</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-neutral-500 mt-3">{formatDate(note.updated_at)}</p>
    </div>
  );
}
