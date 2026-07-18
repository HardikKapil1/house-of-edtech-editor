import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
          House of EdTech Editor
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          A cleaner, collaborative workspace for documents and learning content.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          The app now focuses on the real experience: document management, shared editing,
          history, and secure access without the starter-template noise.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-full bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Create account
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            "Real-time collaborative editing",
            "Role-based document sharing",
            "Version history and snapshots",
          ].map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              {feature}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
