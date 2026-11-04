import "server-only";
import { redirect } from "next/navigation";
import { createClient, type ServerSupabase } from "@/lib/supabase/server";

export type StaffCheck =
  | { status: "staff"; supabase: ServerSupabase; userId: string; name: string }
  | { status: "not_staff"; email: string };

/** For pages: redirects to /login if logged out; tells the page if the user isn't staff. */
export async function getStaff(): Promise<StaffCheck> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "staff") return { status: "not_staff", email: auth.user.email ?? "" };
  return {
    status: "staff",
    supabase,
    userId: auth.user.id,
    name: profile.full_name || profile.email || "Staff",
  };
}

/** For server actions: returns a Supabase client or throws. RLS is the real guard; this gives a clear message. */
export async function requireStaff(): Promise<ServerSupabase> {
  const s = await getStaff();
  if (s.status !== "staff") throw new Error("Only staff accounts can do this.");
  return s.supabase;
}
