"use client";

import { useRouter } from "next/navigation";
import DocumentCard from "@/components/document/document-card";
import { useState } from "react";

interface DashboardClientProps {
  ownedDocuments: {
    id: string;
    title: string | null;
    updatedAt: Date;
  }[];
  sharedDocuments: {
    id: string;
    title: string | null;
    updatedAt: Date;
  }[];
}

export default function DashboardClient({ ownedDocuments, sharedDocuments }: DashboardClientProps) {
  const router = useRouter();
  
  // 1. Moved state and filter logic to the top level of the component
  const [search, setSearch] = useState("");
  
  // 2. Added a fallback `|| ""` so .toLowerCase() doesn't crash on null titles
  const filteredOwnedDocuments = ownedDocuments.filter((document) =>
    (document.title || "").toLowerCase().includes(search.toLowerCase())
  );
 const filteredSharedDocuments = sharedDocuments.filter((document) =>
    (document.title || "").toLowerCase().includes(search.toLowerCase())
  );


  async function createDocument() {
    const response = await fetch("/api/documents", {
      method: "POST",
    });

    const data = await response.json();

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
          Dashboard
        </h1>

        <button
          onClick={createDocument}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          + New Document
        </button>
      </div>
      
      <input
        type="text"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-6 w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* My Documents */}
      <section className="mt-8">
        <h2 className="mb-4 border-b pb-2 text-xl font-semibold">
          My Documents
        </h2>

        {filteredOwnedDocuments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No owned documents found.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredOwnedDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                id={document.id}
                title={document.title}
                updatedAt={document.updatedAt}
              />
            ))}
          </div>
        )}
      </section>

      {/* Shared Documents */}
      <section className="mt-12">
        <h2 className="mb-4 border-b pb-2 text-xl font-semibold">
          Shared With Me
        </h2>

        {filteredSharedDocuments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No shared documents.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredSharedDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                id={document.id}
                title={document.title}
                updatedAt={document.updatedAt}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}