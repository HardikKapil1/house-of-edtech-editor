import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function createCollaborationProvider(documentId: string) {
  const ydoc = new Y.Doc();
  const wsUrl =
    process.env.NEXT_PUBLIC_WS_URL?.trim() || "ws://localhost:1234";

  const provider = new WebsocketProvider(wsUrl, documentId, ydoc);

  return { ydoc, provider };
}