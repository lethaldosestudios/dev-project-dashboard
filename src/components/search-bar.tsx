// src/components/search-bar.tsx
"use client";

import { useRouter } from "next/navigation";

interface SearchBarProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onSearch?: (q: string) => void;
}

export function SearchBar({ value, onChange, placeholder = "Search...", onSearch }: SearchBarProps) {
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value?.trim()) {
      if (onSearch) {
        onSearch(value.trim());
      } else {
        // Navigate to search page with query
        router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      }
    }
  };

  return (
    <div className="relative">
      <svg 
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-neutral-900 border border-neutral-800 rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
      />
    </div>
  );
}
