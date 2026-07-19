// src/lib/sync-queue.ts
import { db } from "@/lib/db";

/**
 * Stores the newest unsynced document state locally so an offline edit is not
 * lost and can be retried once the browser regains connectivity.
 */
export async function queueChange(documentId: string, title: string | null, content: unknown) {
  await db.pendingChanges.put({
    // A document ID as the primary key makes subsequent edits replace the
    // older queued version, ensuring the latest local state is what syncs.
    id: documentId,
    documentId,
    title,
    content,
    updatedAt: Date.now(),
  });
}

/**
 * Sends a document's queued change to the API and removes it only after the
 * server accepts it, so failed requests remain available for a later retry.
 */
export async function flushQueue(documentId: string) {
  const change = await db.pendingChanges.get(documentId);
  if (!change) return;

  const res = await fetch(`/api/documents/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: change.title, content: change.content, clientUpdatedAt: change.updatedAt }),
  });

  if (res.ok) await db.pendingChanges.delete(documentId);

  // Return the response so the UI can surface a stale-write conflict to the user.
  return res;
}