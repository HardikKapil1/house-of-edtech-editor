// src/app/documents/[id]/page.tsx

import DocumentToolbar from "@/components/document/document-toolbar";
import TipTapEditor from "@/components/editor/tiptap-editor";

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
    where: {
      id,
    },
  });

  if (!document) {
    notFound();
  }

  const role = membership.role;

  const canRestore =
    role === DocumentRole.OWNER ||
    role === DocumentRole.EDITOR;

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Document workspace
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Document
          </h1>
        </div>

        <DocumentToolbar
          documentId={document.id}
          role={role}
          canRestore={canRestore}
        />
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