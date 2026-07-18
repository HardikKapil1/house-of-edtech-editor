// src/app/api/documents/[id]/snapshots/[snapshotId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getMembership, canEdit, canView } from "@/lib/document-permissions";
interface RouteProps {
  params: Promise<{
    id: string;
    snapshotId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const user = await requireCurrentUser();
    const { id, snapshotId } = await params;

    const membership = await getMembership(id, user.id);

    if (!membership || !canView(membership.role)) {
      return NextResponse.json(
        {
          error: "You don't have permission to view this snapshot.",
        },
        {
          status: 403,
        },
      );
    }

    const snapshot = await prisma.snapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ snapshot }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch snapshot" },
      { status: 500 },
    );
  }
}
export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const user = await requireCurrentUser();
    const { id, snapshotId } = await params;

    const membership = await getMembership(id, user.id);

    if (!membership || !canEdit(membership.role)) {
      return NextResponse.json(
        {
          error: "You don't have permission to update this snapshot.",
        },
        {
          status: 403,
        },
      );
    }

    const snapshot = await prisma.snapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 },
      );
    }
    const updatedSnapshot = await prisma.snapshot.update({
      where: { id: snapshotId },
      data: {
        content: await request.json(),
      },
    });

    return NextResponse.json(
      { message: "Snapshot updated successfully", snapshot: updatedSnapshot },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update snapshot" },
      { status: 500 },
    );
  }
}
