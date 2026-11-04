import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { toCsv } from "@/lib/csv";

const TABLES = ["members", "weight_logs", "plans", "foods", "exercises"] as const;
type ExportTable = (typeof TABLES)[number];
const PAGE = 1000;

/** CSV backup of one table. Staff only — RLS returns nothing to anyone else. */
export async function GET(_req: Request, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  if (!(TABLES as readonly string[]).includes(table)) {
    return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  }
  if (!getSupabaseEnv()) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table as ExportTable)
      .select("*")
      .order("created_at")
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows.push(...(data as Record<string, unknown>[]));
    if (!data || data.length < PAGE) break;
  }

  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  // BOM so Excel opens ₹ and Hindi text correctly.
  return new NextResponse(`﻿${toCsv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${table}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
