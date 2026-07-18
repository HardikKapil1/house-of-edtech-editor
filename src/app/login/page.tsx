import LoginForm from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-[420px] rounded-xl border p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">
          Welcome Back
        </h1>

        <LoginForm />
      </div>
    </main>
  );
}