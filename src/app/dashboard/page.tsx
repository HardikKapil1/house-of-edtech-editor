// src/app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/features/dashboard/dashboard-client";
import { prisma } from "@/lib/prisma";


export default async function DashboardPage() {
  const session = await auth();

if (!session?.user?.email) {
  redirect("/login");
}

const user = await prisma.user.findUnique({
  where: {
    email: session.user.email,
  },
});

if (!user) {
  redirect("/login");
}

const ownedDocuments = (
  await prisma.document.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })
).map((doc) => ({
  ...doc,
  role: "OWNER" as const,
}));

const sharedDocumentsRaw = await prisma.document.findMany({
  where: {
    ownerId: {
      not: user.id,
    },
    members: {
      some: {
        userId: user.id,
      },
    },
  },
  include: {
    members: {
      where: {
        userId: user.id,
      },
      select: {
        role: true,
      },
    },
  },
  orderBy: {
    updatedAt: "desc",
  },
});

const sharedDocuments = sharedDocumentsRaw.map((doc) => ({
  ...doc,
  role: doc.members[0].role,
}));

return <DashboardClient ownedDocuments={ownedDocuments} sharedDocuments={sharedDocuments} />;
}