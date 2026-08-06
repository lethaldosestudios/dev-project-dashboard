// src/components/search-bar.tsx
"use client";

import { useRouter } from "next/navigation";
import { GlowInput } from "./ui/glow-input";

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
        router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      }
    }
  };

  return (
    <div className="relative focus-ring rounded-xl">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
        <SearchIcon className="w-5 h-5" />
      </div>
      <GlowInput
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-12 pr-4"
        glowColor="blue"
      />
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
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
  );
}
