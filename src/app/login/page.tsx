import { getSupabaseEnv } from "@/lib/supabase/env";
import { SetupNeeded } from "@/components/SetupNeeded";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in — Gym Planner" };

export default function LoginPage() {
  if (!getSupabaseEnv()) return <SetupNeeded />;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-6">
        <h1 className="text-2xl font-bold">
          Gym <span className="text-brand">Planner</span>
        </h1>
        <p className="mb-6 mt-1 text-muted">Staff login</p>
        <LoginForm />
        <p className="mt-6 text-sm text-muted">
          No account? Ask the gym owner — accounts are created by the owner only.
        </p>
      </div>
    </main>
  );
}
