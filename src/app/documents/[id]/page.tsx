import TipTapEditor from "@/components/editor/tiptap-editor";
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

  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl p-10">
      <TipTapEditor
        documentId={document.id}
        initialTitle={document.title}
        content={document.content as JSONContent}
      />
    </main>
  );
}