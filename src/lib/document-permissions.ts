// src/lib/document-permissions.ts
import { prisma } from "@/lib/prisma";
import { DocumentRole } from "@/generated/prisma";

export async function getMembership(documentId: string, userId: string) {
  const documentMember = await prisma.documentMember.findUnique({
    where: {
      documentId_userId: {
        documentId,
        userId,
      },
    },
  });
  return documentMember || null;
}

export function canView(role: DocumentRole) {
  return (
    role === DocumentRole.VIEWER ||
    role === DocumentRole.EDITOR ||
    role === DocumentRole.OWNER
  );
}

export function canEdit(role: DocumentRole) {
  return role === DocumentRole.EDITOR || role === DocumentRole.OWNER;
}

export function canShare(role: DocumentRole) {
  return role === DocumentRole.OWNER;
}

export function canDelete(role: DocumentRole) {
  return role === DocumentRole.OWNER;
}
