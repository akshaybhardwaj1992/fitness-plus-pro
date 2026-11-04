/** Public Supabase settings. Returns null when not configured yet (app shows setup steps). */
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey || url.includes("YOUR-PROJECT") || anonKey.includes("YOUR-ANON-KEY")) return null;
  return { url, anonKey };
}
