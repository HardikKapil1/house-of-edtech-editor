// src/lib/sync-queue.ts
import { db } from "@/lib/db";

export async function queueChange(documentId: string, title: string | null, content: unknown) {
  await db.pendingChanges.put({
    id: documentId, // one pending row per doc, overwrite = latest wins locally
    documentId,
    title,
    content,
    updatedAt: Date.now(),
  });
}

export async function flushQueue(documentId: string) {
  const change = await db.pendingChanges.get(documentId);
  if (!change) return;

  const res = await fetch(`/api/documents/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: change.title, content: change.content, clientUpdatedAt: change.updatedAt }),
  });

  if (res.ok) await db.pendingChanges.delete(documentId);
}