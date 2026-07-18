// src/app/documents/[id]/page.tsx
import ShareDialog from "@/components/document/share-dialog";
import TipTapEditor from "@/components/editor/tiptap-editor";
import HistoryDialog from "@/components/document/history-dialog";
import SaveVersionButton from "@/components/document/save-version-button"; // 1. Import it
import { requireCurrentUser } from "@/lib/auth-utils";
import { canView, getMembership } from "@/lib/document-permissions";
import { prisma } from "@/lib/prisma";
import { JSONContent } from "@tiptap/core";
import { notFound } from "next/navigation";
import { DocumentRole } from "@/generated/prisma";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;

  const user = await requireCurrentUser();
  const membership = await getMembership(id, user.id);

  if (!membership || !canView(membership.role)) {
    notFound();
  }
  
  const document = await prisma.document.findUnique({
    where: { id },
  });

  const role = membership.role;
  
  if (!document) {
    notFound();
  }

  const canRestore = role === DocumentRole.OWNER || role === DocumentRole.EDITOR;

  return (
    <main className="mx-auto max-w-5xl p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Document</h1>
        
        <div className="flex items-center gap-4">
          <HistoryDialog 
            documentId={document.id} 
            canRestore={canRestore} 
          />
          
          {/* 2. Use the Client Component here and pass the documentId */}
          <SaveVersionButton documentId={document.id} />
          
          {role === DocumentRole.OWNER && (
            <ShareDialog documentId={document.id} />
          )}
        </div>
      </div>
      
      <TipTapEditor
        documentId={document.id}
        initialTitle={document.title}
        content={document.content as JSONContent}
        editable={role !== DocumentRole.VIEWER}
      />
    </main>
  );
}