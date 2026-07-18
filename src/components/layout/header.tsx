"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();
  if (!session) return null;

  return (
    <header className="border-b px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="font-bold text-lg">
        DocEditor
      </Link>
      <span className="text-sm text-gray-500">{session.user?.email}</span>
    </header>
  );
}