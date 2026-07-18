// src/features/dashboard/dashboard-client.tsx
"use client";

import { useRouter } from "next/navigation";
import DocumentCard from "@/components/document/document-card";

interface DashboardClientProps {
  documents: {
    id: string;
    title: string|null;
    updatedAt: Date;
  }[];
}

export default function DashboardClient({ documents }: DashboardClientProps) {
  const router = useRouter();

async function createDocument() {
  const response = await fetch("/api/documents", {
    method: "POST",
  });

  const data = await response.json();

  console.log("API Response:------------------------------------------------------------------", data);

  if (!response.ok) {
    alert("Failed");
    return;
  }

  router.push(`/documents/${data.document.id}`);
}

  return (
  <main className="mx-auto max-w-6xl p-8">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">
        My Documents
      </h1>

      <button
        onClick={createDocument}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        + New Document
      </button>
    </div>

    <div className="mt-8 space-y-4">
      {documents.length === 0 ? (
        <p className="text-center text-gray-500">
          No documents yet.
        </p>
      ) : (
        documents.map((document) => (
          <DocumentCard
            key={document.id}
            id={document.id}
            title={document.title}
            updatedAt={document.updatedAt}
          />
        ))
      )}
    </div>
  </main>
);
}