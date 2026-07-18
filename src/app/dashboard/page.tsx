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

const documents = await prisma.document.findMany({
  where: {
    ownerId: user.id,
  },
  orderBy: {
    updatedAt: "desc",
  },
});

return <DashboardClient documents={documents} />;
}