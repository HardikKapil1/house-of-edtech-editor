import Dexie, { Table } from "dexie";

export interface PendingChange {
  id: string;
  documentId: string;
  title: string | null;
  content: unknown;
  updatedAt: number;
}

class OfflineDB extends Dexie {
  pendingChanges!: Table<PendingChange>;

  constructor() {
    super("collaborative-editor");

    this.version(1).stores({
      pendingChanges: "id, documentId, updatedAt",
    });
  }
}

export const db = new OfflineDB();