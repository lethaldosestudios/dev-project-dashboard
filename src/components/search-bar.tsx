// src/components/search-bar.tsx
import { Input } from "@/components/ui/input";

export function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <Input
      type="search"
      placeholder="Search projects, notes, resources..."
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}
