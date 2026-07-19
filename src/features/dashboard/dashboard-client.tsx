"use client";

import { useRouter } from "next/navigation";
import DocumentCard from "@/components/document/document-card";
import { useState } from "react";
import { DocumentRole } from "@/generated/prisma";
import { toast } from "sonner";
import { FileText, Plus, Search } from "lucide-react";

interface DashboardClientProps {
  ownedDocuments: { id: string; title: string | null; updatedAt: Date; role: DocumentRole; }[];
  sharedDocuments: { id: string; title: string | null; updatedAt: Date; role: DocumentRole; }[];
}

export default function DashboardClient({ ownedDocuments, sharedDocuments }: DashboardClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const filteredOwnedDocuments = ownedDocuments.filter((document) => (document.title || "").toLowerCase().includes(search.toLowerCase()));
  const filteredSharedDocuments = sharedDocuments.filter((document) => (document.title || "").toLowerCase().includes(search.toLowerCase()));

  async function createDocument() {
    try {
      const response = await fetch("/api/documents", { method: "POST" });
      if (!response.ok) { toast.error("Failed to create document"); return; }
      const data = await response.json();
      toast.success("Document created.");
      router.push(`/documents/${data.document.id}`);
    } catch (error) { console.error(error); toast.error("Something went wrong"); }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-7xl px-4 py-9 sm:px-6 lg:py-11">
      <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-blue-600">Workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Your documents</h1><p className="mt-2 text-sm text-muted-foreground">Write, collaborate, and keep every idea in one place.</p></div>
        <button onClick={createDocument} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 active:translate-y-0"><Plus className="size-4" />New document</button>
      </div>
      <div className="relative mt-6 max-w-xl"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10" /></div>
      <section className="mt-9"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold tracking-tight">My documents</h2><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{filteredOwnedDocuments.length}</span></div>{filteredOwnedDocuments.length === 0 ? <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><FileText className="size-5" /></span><p className="mt-3 text-sm font-medium">No documents found</p><p className="mt-1 text-sm text-muted-foreground">Create a new document to begin writing.</p></div> : <div className="grid gap-3 md:grid-cols-2">{filteredOwnedDocuments.map((document) => <DocumentCard key={document.id} id={document.id} title={document.title} updatedAt={document.updatedAt} role={document.role} />)}</div>}</section>
      <section className="mt-10"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold tracking-tight">Shared with me</h2><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{filteredSharedDocuments.length}</span></div>{filteredSharedDocuments.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-9 text-center text-sm text-muted-foreground">Documents shared with you will appear here.</div> : <div className="grid gap-3 md:grid-cols-2">{filteredSharedDocuments.map((document) => <DocumentCard key={document.id} id={document.id} title={document.title} updatedAt={document.updatedAt} role={document.role} />)}</div>}</section>
    </main>
  );
}