"use client";

import { useState } from "react";

interface Props {
  connected: boolean;
  username: string | null;
}

export function XConnectionCard({ connected, username }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setSyncStatus("Starting sync...");
    try {
      const res = await fetch("/api/sync/x", { method: "POST" });
      if (res.status === 409) {
        setSyncStatus("A sync is already running.");
        setSyncing(false);
        return;
      }
      if (!res.ok) {
        setSyncStatus("Failed to start sync.");
        setSyncing(false);
        return;
      }
      const { syncJobId } = await res.json();
      pollSyncStatus(syncJobId);
    } catch {
      setSyncStatus("Error starting sync.");
      setSyncing(false);
    }
  }

  async function pollSyncStatus(jobId: string) {
    const poll = async () => {
      try {
        const res = await fetch(`/api/sync/status/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "completed") {
          setSyncStatus(`Complete — ${data.count} bookmarks synced`);
          setSyncing(false);
          return;
        }
        if (data.status === "failed") {
          setSyncStatus(`Failed: ${data.error ?? "Unknown error"}`);
          setSyncing(false);
          return;
        }
        if (data.rateLimitResetAt) {
          const resumeIn = Math.max(
            0,
            Math.ceil((new Date(data.rateLimitResetAt).getTime() - Date.now()) / 60000),
          );
          setSyncStatus(`Synced ${data.count} bookmarks — paused, resuming in ${resumeIn} min`);
        } else {
          setSyncStatus(`Synced ${data.count} bookmarks...`);
        }
        setTimeout(poll, 3000);
      } catch {
        setSyncStatus("Error checking sync status.");
        setSyncing(false);
      }
    };
    setTimeout(poll, 2000);
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect X? Your synced bookmarks will be kept.")) return;
    setDisconnecting(true);
    await fetch("/api/connections/x", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">X (Twitter)</p>
          {connected ? (
            <p className="text-sm text-gray-400">
              Connected as <span className="text-white">@{username}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">Import your X bookmarks</p>
          )}
        </div>
        <div className="flex gap-2">
          {connected ? (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 border border-gray-700 text-gray-400 rounded-lg text-sm hover:border-red-500 hover:text-red-400 transition"
              >
                Disconnect
              </button>
            </>
          ) : (
            <a
              href="/api/connections/x"
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              Connect X
            </a>
          )}
        </div>
      </div>
      {syncStatus && (
        <p className="mt-3 text-sm text-gray-400">{syncStatus}</p>
      )}
    </div>
  );
}
