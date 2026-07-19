"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); setError(""); const result = await signIn("credentials", { email, password, redirect: false }); if (result?.error) { setError("Invalid email or password"); return; } router.push("/dashboard"); router.refresh(); }
  return <form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-1.5"><label htmlFor="login-email" className="text-sm font-medium">Email</label><input id="login-email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10" /></div><div className="space-y-1.5"><label htmlFor="login-password" className="text-sm font-medium">Password</label><input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10" /></div>{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button type="submit" className="h-10 w-full rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 active:scale-[0.99]">Sign in</button><p className="pt-2 text-center text-sm text-muted-foreground">Don&apos;t have an account? <Link href="/register" className="font-medium text-blue-600 transition hover:text-blue-700 hover:underline">Create one</Link></p></form>;
}