// src/app/api/documents/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Assign the transaction result to a variable
    const document = await prisma.$transaction(async (tx) => {
      const newDoc = await tx.document.create({
        data: {
          title: "Untitled Document",
          content: {
            type: "doc",
            content: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                },
              ],
            },
          },
          ownerId: user.id,
        },
      });

      await tx.documentMember.create({
        data: {
          userId: user.id,
          documentId: newDoc.id,
          role: "OWNER",
        },
      });

      // 2. Return the data out of the transaction
      return newDoc;
    });

    // 3. Return the HTTP response out of the route handler
    return NextResponse.json(
      { message: "Document created successfully", document },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: {
      id,
    },
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
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}

export async function PUT(request: Request, { params }: RouteProps) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();

  const document = await prisma.document.update({
    where: {
      id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return NextResponse.json(document);
}
