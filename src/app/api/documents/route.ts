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

    const document = await prisma.$transaction(async (tx) => {
      const newDoc = await tx.document.create({
        data: {
          title: "Untitled Document",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
              },
            ],
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

      return newDoc;
    });

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
