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
    const user = await requireCurrentUser();

    const { id } = await params;

    const { title, content } = await request.json();

    const membership = await getMembership(id, user.id);

    if (!membership || !canEdit(membership.role)) {
      return NextResponse.json(
        {
          error: "You don't have permission to edit this document.",
        },
        {
          status: 403,
        },
      );
    }
    const document = await prisma.document.update({
      where: { id },
      data: {
        title,
        content,
      },
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
