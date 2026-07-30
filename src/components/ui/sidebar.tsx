import Link from "next/link";
import React from "react";

export function Sidebar({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="w-64 hidden md:block" aria-label="Main navigation">
      <nav className="space-y-2 sticky top-6">{children}</nav>
    </aside>
  );
}
