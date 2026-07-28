// src/components/github-sync-status.tsx
"use client";

import { useState } from "react";
import { LiquidButton } from "./ui/liquid-button";
import type { SyncRun } from "@/types";

interface SyncResult {
  ok: boolean;
  syncRun?: SyncRun;
  error?: string;
}

interface GitHubSyncStatusProps {
  lastSync: SyncRun | null;
}

export function GitHubSyncStatus({ lastSync }: GitHubSyncStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncRun | null>(lastSync);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/sync/github", {
        method: "POST",
        headers: {
          // Token should be provided via environment or secure input
        },
      });

      const result = await response.json() as SyncResult;
      
      if (result.ok && result.syncRun) {
        setSyncStatus(result.syncRun);
      } else {
        setError(result.error || "Sync failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync error");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!lastSync && !isSyncing) {
    return (
      <LiquidButton 
        variant="secondary" 
        size="sm" 
        onClick={handleSync}
        disabled={isSyncing}
      >
        <SyncIcon className="w-4 h-4" />
        Sync GitHub
      </LiquidButton>
    );
  }

  if (isSyncing) {
    return (
      <LiquidButton variant="secondary" size="sm" disabled>
        <SyncIcon className="w-4 h-4 animate-spin" />
        Syncing...
      </LiquidButton>
    );
  }

  if (error) {
    return (
      <LiquidButton variant="secondary" size="sm" onClick={handleSync}>
        <SyncIcon className="w-4 h-4" />
        {error}
      </LiquidButton>
    );
  }

  if (syncStatus) {
    const isSuccess = syncStatus.status === "completed";
    
    return (
      <LiquidButton 
        variant={isSuccess ? "primary" : "secondary"} 
        size="sm" 
        onClick={handleSync}
        disabled={isSyncing}
      >
        <SyncIcon className={`w-4 h-4 ${isSuccess ? "text-accent-primary" : "text-white/70"}`} />
        <span>
          {syncStatus.status === "completed" 
            ? `Synced ${formatTimeAgo(syncStatus.started_at)}`
            : syncStatus.status}
        </span>
        {syncStatus.records_processed > 0 && (
          <span className="text-xs text-white/50 ml-1">+{syncStatus.records_processed}</span>
        )}
      </LiquidButton>
    );
  }

  return null;
}

// Sync Icon Component
function SyncIcon({ className }: { className?: string }) {
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
        d="M4 4v5h5M20 20v-5h-5M4 20L20 4" 
      />
    </svg>
  );
}
