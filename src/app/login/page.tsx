import LoginForm from "@/features/auth/components/login-form";

export default function LoginPage() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12"><section className="w-full max-w-md rounded-2xl border border-border bg-background p-7 shadow-xl shadow-slate-950/5 sm:p-8"><p className="text-sm font-medium text-blue-600">House of EdTech</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your workspace.</p><div className="mt-7"><LoginForm /></div></section></main>;
}