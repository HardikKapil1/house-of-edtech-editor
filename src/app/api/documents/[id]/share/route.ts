// src/app/api/documents/[id]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth-utils";
import { getMembership, canShare } from "@/lib/document-permissions";
import { prisma } from "@/lib/prisma";
import { DocumentRole } from "@/generated/prisma";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const currentUser = await requireCurrentUser();

    const { id } = await params;
    const body = await request.json();
    const { email, role } = body;

    if (role !== DocumentRole.VIEWER && role !== DocumentRole.EDITOR) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const membership = await getMembership(id, currentUser.id);

    if (!membership || !canShare(membership.role)) {
      return NextResponse.json(
        {
          error: "Only the owner can share this document.",
        },
        {
          status: 403,
        },
      );
    }

    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (invitedUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "You already own this document." },
        { status: 400 },
      );
    }

    const existingMember = await prisma.documentMember.findUnique({
      where: {
        documentId_userId: {
          documentId: id,
          userId: invitedUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "Already shared with this user." },
        { status: 409 },
      );
    }

    await prisma.documentMember.create({
      data: {
        documentId: id,
        userId: invitedUser.id,
        role,
      },
    });

    return NextResponse.json({
      message: "Document shared successfully.",
    });
  } catch (error) {
    console.error("[DOCUMENT_SHARE_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
