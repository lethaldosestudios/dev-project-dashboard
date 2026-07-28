// src/components/notes-editor.tsx
import { Textarea } from "@/components/ui/textarea";

export function NotesEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[200px]"
    />
  );
}
