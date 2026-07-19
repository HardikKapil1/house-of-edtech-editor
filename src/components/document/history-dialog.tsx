// src/components/document/history-dialog.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

type Snapshot = {
  id: string;
  version: number;
  title: string;
  createdAt: string;
};

interface HistoryDialogProps {
  documentId: string;
  canRestore: boolean;
  onRestore?: () => void;
}

export default function HistoryDialog({
  documentId,
  canRestore,
  onRestore,
}: HistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/snapshots`);
      if (!response.ok) {
        throw new Error("Failed to fetch snapshots");
      }

      const data = await response.json();
      setSnapshots(Array.isArray(data) ? data : (data.snapshots || []));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (open) {
      void fetchSnapshots();
    }
  }, [open, fetchSnapshots]);

  async function restoreSnapshot(snapshotId: string) {
    setRestoringId(snapshotId);
    try {
      const response = await fetch(
        `/api/documents/${documentId}/snapshots/${snapshotId}/restore`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to restore snapshot");
      }

      onRestore?.();
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="h-9 rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md active:scale-[0.98]"
      >
        View History
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-semibold tracking-tight">Document history</h2><p className="mb-5 text-sm text-muted-foreground">Restore a previously saved version when needed.</p>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
  Loading...
</p>
            ) : snapshots.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
  No snapshots available.
</p>
            ) : (
              <ul className="space-y-2">
                {snapshots.map((snapshot) => (
                  <li
                    key={snapshot.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {snapshot.version} • {snapshot.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(snapshot.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {canRestore && (
                      <button
                        onClick={() => restoreSnapshot(snapshot.id)}
                        disabled={restoringId === snapshot.id}
                        className="ml-4 h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        {restoringId === snapshot.id ? "Restoring..." : "Restore"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setOpen(false)}
              className="mt-4 h-9 rounded-xl border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}