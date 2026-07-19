// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth-utils";
import {
  getMembership,
  canView,
  canEdit,
  canDelete,
} from "@/lib/document-permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AuditAction, Prisma } from "@/generated/prisma";
import { createAuditLog } from "@/lib/audit-log";
import { documentUpdateSchema } from "@/lib/validation";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const user = await requireCurrentUser();

    const { id } = await params;

    const membership = await getMembership(id, user.id);

    if (!membership || !canView(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ...document, role: membership.role });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  try {
    const body = await request.json();
    const parsedBody = documentUpdateSchema.safeParse(body);

    // Reject large content before it reaches Prisma: this limits costly JSON work
    // and storage, preventing a malicious oversized update from exhausting memory.
    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }

    const user = await requireCurrentUser();
    const { id } = await params;
    const { title, content, clientUpdatedAt } = parsedBody.data;
    const membership = await getMembership(id, user.id);

    if (!membership || !canEdit(membership.role)) {
      return NextResponse.json(
        { error: "You don't have permission to edit this document." },
        { status: 403 },
      );
    }

    if (typeof clientUpdatedAt !== "number" || !Number.isFinite(clientUpdatedAt)) {
      return NextResponse.json(
        { error: "A valid clientUpdatedAt timestamp is required." },
        { status: 400 },
      );
    }

    const current = await prisma.document.findUnique({
      where: { id },
      select: { title: true, content: true, updatedAt: true, version: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Last-Write-Wins is deterministic: an edit made before the server's current
    // version always loses, so an offline client cannot silently overwrite newer data.
    // if (clientUpdatedAt < current.updatedAt.getTime()) {
    //   return NextResponse.json(
    //     {
    //       error: "Server has newer changes.",
    //       document: { title: current.title, content: current.content },
    //     },
    //     { status: 409 },
    //   );
    // }

    // The version predicate makes the read-then-write decision atomic: if another
    // request wins first, this write is rejected instead of causing silent data loss.
    const updateResult = await prisma.document.updateMany({
      where: { id, version: current.version },
      data: {
        // Null or omitted title means this partial update leaves the title unchanged.
        title: title ?? undefined,
        // Prisma represents a JSON null explicitly; all other JSON values are valid.
        content:
          content === null
            ? Prisma.JsonNull
            : (content as Prisma.InputJsonValue | undefined),
        version: { increment: 1 },
      },
    });

    if (updateResult.count === 0) {
      const latest = await prisma.document.findUnique({
        where: { id },
        select: { title: true, content: true },
      });

      return NextResponse.json(
        {
          error: "Server has newer changes.",
          document: latest,
        },
        { status: 409 },
      );
    }

    const document = await prisma.document.findUniqueOrThrow({ where: { id } });

    await createAuditLog({
      action: AuditAction.DOCUMENT_UPDATED,
      documentId: id,
      userId: user.id,
    });

    revalidatePath("/dashboard");

    return NextResponse.json(document);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 },
    );
  }
}
export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const user = await requireCurrentUser();

    const { id } = await params;

    const membership = await getMembership(id, user.id);

    if (!membership || !canDelete(membership.role)) {
      return NextResponse.json(
        {
          error: "You don't have permission to delete this document.",
        },
        {
          status: 403,
        },
      );
    }

    await createAuditLog({
      action: AuditAction.DOCUMENT_DELETED,
      documentId: id,
      userId: user.id,
    });
    await prisma.document.delete({
      where: {
        id,
      },
    });

    revalidatePath("/dashboard");

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
