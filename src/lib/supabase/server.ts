import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Uses the public anon key + the logged-in user's session cookie, so every
 * query is checked by Row Level Security. The service-role key is never used.
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase is not configured. See README → Setup.");
  const cookieStore = await cookies();
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there. Middleware refreshes them.
        }
      },
    },
  });
}

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;
