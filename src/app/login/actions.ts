"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; email: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = /invalid/i.test(error.message)
      ? "Email or password is wrong. Please try again."
      : "Could not log in right now. Check your internet and try again.";
    return { error: msg, email };
  }
  redirect("/members");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
