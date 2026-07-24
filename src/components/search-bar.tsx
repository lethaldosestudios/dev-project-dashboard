// src/components/search-bar.tsx
export function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <input
      type="search"
      placeholder="Search projects, notes, resources..."
      className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm"
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}
