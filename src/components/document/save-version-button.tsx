// src/components/document/save-version-button.tsx
"use client";

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

      alert("Version saved");
    } catch (error) {
      console.error(error);
      alert("Failed to save version");
    }
  }

  return (
    <button
      onClick={createSnapshot}
      className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
    >
      Save Version
    </button>
  );
}