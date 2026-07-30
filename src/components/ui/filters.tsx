import React from "react";
import { GlowInput } from "@/components/ui/glow-input";
import { LiquidButton } from "@/components/ui/liquid-button";

export function Filters({ onSearch }: { onSearch?: (q: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <GlowInput placeholder="Search projects..." className="w-full sm:w-64" onChange={(e: any) => onSearch?.(e.target.value)} />
      <LiquidButton variant="secondary" size="sm">Filter</LiquidButton>
    </div>
  );
}
