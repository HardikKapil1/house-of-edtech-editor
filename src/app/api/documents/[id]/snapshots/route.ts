// src/app/api/documents/[id]/snapshots
import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getMembership, canEdit, canView } from "@/lib/document-permissions";
import { Prisma } from "@/generated/prisma";

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
      return NextResponse.json(
        {
          error:
            "You don't have permission to view snapshots for this document.",
        },
        {
          status: 403,
        },
      );
    }

    const snapshots = await prisma.snapshot.findMany({
      where: {
        documentId: id,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        id: true,
        version: true,
        createdAt: true,
        title: true,
      },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch snapshots" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const user = await requireCurrentUser();
    const { id } = await params;

    const membership = await getMembership(id, user.id);

    if (!membership || !canEdit(membership.role)) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to create a snapshot for this document.",
        },
        {
          status: 403,
        },
      );
    }

    const document = await prisma.document.findUnique({
      where: { id },
    });
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
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

    const newSnapshot = await prisma.snapshot.create({
      data: {
        documentId: id,
        version: nextVersion,
        title: document.title,
        content: document.content as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(
      { success: true, snapshot: newSnapshot },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 },
    );
  }
}
