import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">
        Welcome {session.user?.name}
      </h1>

      <p className="mt-4">
        Authentication is working correctly! You are logged in as {session.user?.email}.
      </p>
    </main>
  );
}