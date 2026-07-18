// src/app/api/documents/[id]/activity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getMembership, canView } from "@/lib/document-permissions";

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
          error: "You don't have permission to view activity.",
        },
        { status: 403 },
      );
    }

    const activity = await prisma.auditLog.findMany({
        where: {
            documentId: id,
        },
        orderBy: {
            createdAt: "desc",
        },
        // Remove the old 'select' block and replace it with this:
        include: {
            user: {
            select: {
                name: true,
                email: true,
            },
            },
        },
        });

    return NextResponse.json(activity);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch activity",
      },
      {
        status: 500,
      },
    );
  }
}
