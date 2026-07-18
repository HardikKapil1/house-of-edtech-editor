"use client";

import { useRouter } from "next/navigation";
import DocumentCard from "@/components/document/document-card";
import { useState } from "react";
import { DocumentRole } from "@/generated/prisma";

interface DashboardClientProps {
  ownedDocuments: {
    id: string;
    title: string | null;
    updatedAt: Date;
    role: DocumentRole;
  }[];
  sharedDocuments: {
    id: string;
    title: string | null;
    updatedAt: Date;
    role: DocumentRole;
  }[];
}

export default function DashboardClient({ ownedDocuments, sharedDocuments }: DashboardClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  
  const filteredOwnedDocuments = ownedDocuments.filter((document) =>
    (document.title || "").toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredSharedDocuments = sharedDocuments.filter((document) =>
    (document.title || "").toLowerCase().includes(search.toLowerCase())
  );

  async function createDocument() {
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
      });

      if (!response.ok) {
        alert("Failed to create document");
        return;
      }

      const data = await response.json();
      router.push(`/documents/${data.document.id}`);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
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
                role={document.role} 
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
                role={document.role} 
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}