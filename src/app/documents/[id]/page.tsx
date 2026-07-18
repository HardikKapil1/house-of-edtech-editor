//src/app/documents/[id]/page.tsx
import ShareDialog from "@/components/document/share-dialog";
import TipTapEditor from "@/components/editor/tiptap-editor";
import { requireCurrentUser } from "@/lib/auth-utils";
import { canView, getMembership } from "@/lib/document-permissions";
import { prisma } from "@/lib/prisma";
import { JSONContent } from "@tiptap/core";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentPage({
  params,
}: PageProps) {
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

  return (
    <main className="mx-auto max-w-5xl p-10">
      <div className="mb-6 flex items-center justify-between">
  <h1 className="text-3xl font-bold">
    Document
  </h1>
<ShareDialog documentId={document.id} />
</div>
      <TipTapEditor
        documentId={document.id}
        initialTitle={document.title}
        content={document.content as JSONContent}
      />
    </main>
  );
}