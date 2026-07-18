// src/app/api/documents/[id]/snapshots/[snapshotId]/restore/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth-utils";
import { getMembership, canEdit } from "@/lib/document-permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { id, snapshotId } = await params;

    const membership = await getMembership(id, user.id);

    if (!membership || !canEdit(membership.role)) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to restore this document.",
        },
        {
          status: 403,
        },
      );
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const snapshot = await prisma.snapshot.findUnique({
      where: { id: snapshotId },
    });
    if (!snapshot) {
      return NextResponse.json(
        { error: "No snapshots found for this document" },
        { status: 404 },
      );
    }
    if (snapshot.documentId !== id) {
      return NextResponse.json(
        {
          error: "Invalid snapshot.",
        },
        {
          status: 400,
        },
      );
    }
    const latestSnapshot = await prisma.snapshot.findFirst({
      where: {
        documentId: id,
      },
      orderBy: {
        version: "desc",
      },
    });

    const nextVersion = latestSnapshot ? latestSnapshot.version + 1 : 1;

    await prisma.$transaction(async (tx) => {
      // Backup current document

      await tx.snapshot.create({
        data: {
          documentId: id,
          version: nextVersion,
          title: document.title,
          content: document.content as Prisma.InputJsonValue,
        },
      });

      // Restore selected version

      await tx.document.update({
        where: {
          id,
        },
        data: {
          title: snapshot.title,
          content: snapshot.content as Prisma.InputJsonValue,
        },
      });
    });

    return NextResponse.json(
      { message: "Document restored successfully", snapshot },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to restore snapshot" },
      { status: 500 },
    );
  }
}
