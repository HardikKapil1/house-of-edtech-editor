// src/components/document/save-version-button.tsx
"use client";

import { toast } from "sonner";

interface SaveVersionButtonProps {
  documentId: string;
}

export default function SaveVersionButton({ documentId }: SaveVersionButtonProps) {
  
  async function createSnapshot() {
    try {
      const response = await fetch(`/api/documents/${documentId}/snapshots`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create snapshot");
      }

      toast.success("Version saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save version");
    }
  }

  return (
    <button
      onClick={createSnapshot}
      className="h-9 rounded-xl bg-blue-600 px-3.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
    >
      Save Version
    </button>
  );
}