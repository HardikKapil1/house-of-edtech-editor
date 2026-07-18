import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { title, content } = await request.json();

    const document = await prisma.document.update({
      where: {
        id,
      },
      data: {
        title,
        content,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: RouteProps
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  await prisma.document.deleteMany({
    where: {
      id,
      ownerId: user.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}