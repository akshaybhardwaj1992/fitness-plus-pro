import Image from "next/image";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { SetupNeeded } from "@/components/SetupNeeded";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in — Fitness+ Gym" };

export default function LoginPage() {
  if (!getSupabaseEnv()) return <SetupNeeded />;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink p-4">
      {/* Logo & Gym name */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Image src="/logo.png" alt="Fitness+ Gym Logo" width={110} height={110} priority />
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          Fitness<span className="text-brand">+</span> Gym
        </h1>
        <p className="text-sm text-muted">Transform · Strengthen · Excel</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-6 shadow-xl">
        <p className="mb-5 text-center font-semibold text-muted">Staff Login</p>
        <LoginForm />
      </div>

      {/* Coaches footer */}
      <div className="mt-6 rounded-xl border border-line bg-card/60 px-5 py-3 text-center text-sm">
        <p className="font-semibold text-white">Head Coaches</p>
        <p className="mt-1 text-muted">
          <span className="text-brand font-medium">Deepak Tanwar</span>
          <span className="text-muted"> — Dietitian Certified</span>
        </p>
        <p className="text-muted">
          <span className="text-brand font-medium">Manish Tanwar</span>
        </p>
      </div>

      <p className="mt-5 text-xs text-muted">
        No account? Contact the gym owner — accounts are created by the owner only.
      </p>
    </main>
  );
}
