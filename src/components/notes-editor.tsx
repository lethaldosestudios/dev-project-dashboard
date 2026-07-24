// src/components/notes-editor.tsx
export function NotesEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      className="w-full min-h-[200px] bg-neutral-900 border border-neutral-800 rounded-md p-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
