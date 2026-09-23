// src/components/cloudflare-deploy-status.tsx
"use client";

import { useState } from "react";
import { LiquidButton } from "./ui/liquid-button";
import type { SyncRun } from "@/types";

interface SyncResult {
  ok: boolean;
  syncRun?: SyncRun;
  error?: string;
}

interface CloudflareDeployStatusProps {
  lastSync: SyncRun | null;
}

export function CloudflareDeployStatus({
  lastSync,
}: CloudflareDeployStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncRun | null>(lastSync);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/sync/deploys", {
        method: "POST",
      });

      const result = (await response.json()) as SyncResult;

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

  if (!lastSync && !isSyncing && !syncStatus) {
    return (
      <LiquidButton
        variant="secondary"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
      >
        <DeployIcon className="w-4 h-4" />
        Sync Cloudflare Deploys
      </LiquidButton>
    );
  }

  if (isSyncing) {
    return (
      <LiquidButton variant="secondary" size="sm" disabled>
        <DeployIcon className="w-4 h-4 animate-spin" />
        Syncing...
      </LiquidButton>
    );
  }

  if (error) {
    return (
      <LiquidButton variant="secondary" size="sm" onClick={handleSync}>
        <DeployIcon className="w-4 h-4 text-accent-red" />
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
        <DeployIcon
          className={`w-4 h-4 ${isSuccess ? "text-accent-primary" : "text-white/70"}`}
        />
        <span>
          {syncStatus.status === "completed"
            ? `Synced ${formatTimeAgo(syncStatus.started_at)}`
            : syncStatus.status}
        </span>
        {syncStatus.records_processed > 0 && (
          <span className="text-xs text-white/50 ml-1">
            +{syncStatus.records_processed}
          </span>
        )}
      </LiquidButton>
    );
  }

  return null;
}

// Cloud / deploy icon
function DeployIcon({ className }: { className?: string }) {
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
        d="M3 15a4 4 0 013.83-2.99 2 2 0 012.34-1.71A4 4 0 0112 10a4 4 0 014 4 2 2 0 01.17 1M12 20a4 4 0 100-8 4 4 0 000 8z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18h12"
      />
    </svg>
  );
}
