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

export async function GET(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;

    const membership = await getMembership(id, user.id);

    if (!membership || !canView(membership.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
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
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...document,
      role: membership.role,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const body = await request.json();

    const parsedBody = documentUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: parsedBody.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const user = await requireCurrentUser();

    const { id } = await params;

    const { title, content } = parsedBody.data;

    const membership = await getMembership(id, user.id);

    if (!membership || !canEdit(membership.role)) {
      return NextResponse.json(
        {
          error: "You don't have permission to edit this document.",
        },
        {
          status: 403,
        }
      );
    }

    const current = await prisma.document.findUnique({
      where: {
        id,
      },
      select: {
        version: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        {
          error: "Document not found",
        },
        {
          status: 404,
        }
      );
    }

    const updateResult = await prisma.document.updateMany({
      where: {
        id,
        version: current.version,
      },
      data: {
        ...(title !== undefined && {
          title,
        }),

        ...(content !== undefined && {
          content:
            content === null
              ? Prisma.JsonNull
              : (content as Prisma.InputJsonValue),
        }),

        version: {
          increment: 1,
        },
      },
    });

    if (updateResult.count === 0) {
      const latest = await prisma.document.findUnique({
        where: {
          id,
        },
        select: {
          title: true,
          content: true,
        },
      });

      return NextResponse.json(
        {
          error: "Server has newer changes.",
          document: latest,
        },
        {
          status: 409,
        }
      );
    }

    const document = await prisma.document.findUniqueOrThrow({
      where: {
        id,
      },
    });

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
      {
        error: "Failed to update document",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteProps
) {
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
        }
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
      {
        error: "Failed to delete document",
      },
      {
        status: 500,
      }
    );
  }
}