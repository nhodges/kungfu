"use client";

import { useState, useEffect } from "react";

interface ApiKeyInfo {
  id: string;
  name: string;
  lastUsed: string | null;
  createdAt: string;
}

export function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [shownKey, setShownKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/keys")
      .then((r) => r.json())
      .then((data) => setKeys(data.keys));
  }, []);

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setShownKey(data.key);
      setNewKeyName("");
      setKeys((prev) => [
        { id: data.id, name: data.name, lastUsed: null, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this API key? Any agents using it will lose access.")) return;
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. 'my-agent')"
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white transition"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newKeyName.trim()}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
        >
          Create Key
        </button>
      </div>

      {shownKey && (
        <div className="bg-gray-900 border border-yellow-600 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-500 mb-1">
            Copy this key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm text-white break-all flex-1">{shownKey}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shownKey);
                setShownKey(null);
              }}
              className="text-xs px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition shrink-0"
            >
              Copy & dismiss
            </button>
          </div>
        </div>
      )}

      {keys.length > 0 ? (
        <div className="space-y-2">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between py-2 border-t border-gray-800 first:border-0">
              <div>
                <p className="text-sm text-white">{key.name}</p>
                <p className="text-xs text-gray-500">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsed && ` · Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => handleDelete(key.id)}
                className="text-xs text-gray-500 hover:text-red-400 transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No API keys yet.</p>
      )}
    </div>
  );
}
