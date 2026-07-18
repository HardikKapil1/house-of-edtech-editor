// src/components/document/history-dialog.tsx
"use client";

import { DocumentRole } from "@/generated/prisma";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (open) {
      fetchSnapshots();
    }
  }, [open]);

  async function fetchSnapshots() {
    
setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/snapshots`);   
    if (!response.ok) {
        throw new Error("Failed to fetch snapshots");
      }

        const data = await response.json();
        setSnapshots(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
    }

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
        className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
      >
        View History
      </button>

        {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="w-full max-w-lg rounded-lg bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold">Document History</h2>
                    {loading ? (

                        <p>Loading...</p>
                    ) : snapshots.length === 0? (
                        <p>No snapshots available.</p>

                    ) : (
                        <ul className="space-y-2">
                            {snapshots.map((snapshot) => (
                                <li key={snapshot.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{snapshot.version} • {snapshot.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(snapshot.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {canRestore && (
                                        <button
                                            onClick={() => restoreSnapshot(snapshot.id)}
                                            disabled={restoringId === snapshot.id}
                                            className="ml-4 rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
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
                        className="mt-4 rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}