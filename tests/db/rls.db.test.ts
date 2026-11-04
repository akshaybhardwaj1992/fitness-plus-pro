// Row Level Security tests against a REAL local Supabase (npx supabase start).
// Run with:  npm run test:db
// Uses the local service-role key ONLY here, to create throw-away test users.
// The app itself never uses the service-role key.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/database.types";

const URL = process.env.SUPABASE_TEST_URL ?? "";
const ANON = process.env.SUPABASE_TEST_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? "";
const enabled = Boolean(URL && ANON && SERVICE);

type DB = SupabaseClient<Database>;
const stamp = Date.now();
const staffEmail = `staff-${stamp}@test.local`;
const memberEmail = `member-${stamp}@test.local`;
const password = "Test-password-123!";

let admin: DB;
let anon: DB;
let staff: DB;
let nonStaff: DB;
const createdUsers: string[] = [];
let memberRowId = "";

async function signIn(email: string): Promise<DB> {
  const c = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

describe.skipIf(!enabled)("RLS (local Supabase)", () => {
  beforeAll(async () => {
    admin = createClient<Database>(URL, SERVICE, { auth: { persistSession: false } });
    anon = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    for (const email of [staffEmail, memberEmail]) {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      createdUsers.push(data.user.id);
    }
    // The owner promotes staff manually — same SQL effect as the README step.
    const { error } = await admin.from("profiles").update({ role: "staff" }).eq("id", createdUsers[0]!);
    if (error) throw error;
    staff = await signIn(staffEmail);
    nonStaff = await signIn(memberEmail);
  });

  afterAll(async () => {
    if (!enabled) return;
    if (memberRowId) await admin.from("members").delete().eq("id", memberRowId);
    for (const id of createdUsers) await admin.auth.admin.deleteUser(id);
  });

  it("new sign-ups start as 'member', not staff", async () => {
    const { data } = await admin.from("profiles").select("role").eq("id", createdUsers[1]!).single();
    expect(data?.role).toBe("member");
  });

  it("staff can create, read, update a member, weight log and plan", async () => {
    const ins = await staff.from("members").insert({
      full_name: `RLS Test ${stamp}`, age: 30, sex: "male", height_cm: 175, weight_kg: 75, goal: "maintenance",
      activity_level: "moderate", diet_type: "vegetarian",
    }).select("id").single();
    expect(ins.error).toBeNull();
    memberRowId = ins.data!.id;

    const read = await staff.from("members").select("id").eq("id", memberRowId);
    expect(read.data).toHaveLength(1);

    const upd = await staff.from("members").update({ weight_kg: 74 }).eq("id", memberRowId).select("weight_kg").single();
    expect(Number(upd.data?.weight_kg)).toBe(74);

    const w = await staff.from("weight_logs").insert({ member_id: memberRowId, weight_kg: 74 });
    expect(w.error).toBeNull();

    const p = await staff.from("plans").insert({ member_id: memberRowId, type: "diet", content: { kind: "diet" } }).select("id").single();
    expect(p.error).toBeNull();
    const pub = await staff.rpc("publish_plan", { p_plan_id: p.data!.id });
    expect(pub.error).toBeNull();

    const foods = await staff.from("foods").select("id").limit(1);
    expect(foods.data?.length).toBe(1);
  });

  it("only one published plan per member per type", async () => {
    const p2 = await staff.from("plans").insert({ member_id: memberRowId, type: "diet", content: { kind: "diet" } }).select("id").single();
    await staff.rpc("publish_plan", { p_plan_id: p2.data!.id });
    const { data } = await staff.from("plans").select("id,status").eq("member_id", memberRowId).eq("type", "diet");
    expect(data?.filter((x) => x.status === "published")).toHaveLength(1);
    expect(data?.find((x) => x.status === "published")?.id).toBe(p2.data!.id);
  });

  for (const table of ["members", "foods", "exercises", "plans", "weight_logs", "profiles"] as const) {
    it(`anonymous visitors cannot read ${table}`, async () => {
      const { data, error } = await anon.from(table).select("*").limit(5);
      // Either a permission error or zero rows — never data.
      expect(error !== null || (data ?? []).length === 0).toBe(true);
    });
  }

  it("anonymous visitors cannot insert", async () => {
    const r = await anon.from("foods").insert({
      name: `hack ${stamp}`, category: "fruits", diet_type: "vegan", serving_size_g: 1, kcal: 1, protein_g: 0, carbs_g: 0, fat_g: 0,
    });
    expect(r.error).not.toBeNull();
  });

  for (const table of ["members", "foods", "exercises", "plans", "weight_logs"] as const) {
    it(`logged-in non-staff cannot read ${table}`, async () => {
      const { data } = await nonStaff.from(table).select("*").limit(5);
      expect(data ?? []).toHaveLength(0);
    });
  }

  it("logged-in non-staff cannot write members, foods or plans", async () => {
    const m = await nonStaff.from("members").insert({
      full_name: "x", age: 30, sex: "male", height_cm: 175, weight_kg: 75, goal: "maintenance",
      activity_level: "moderate", diet_type: "vegan",
    });
    expect(m.error).not.toBeNull();

    const upd = await nonStaff.from("members").update({ full_name: "hacked" }).eq("id", memberRowId).select("id");
    expect(upd.data ?? []).toHaveLength(0);
    const still = await admin.from("members").select("full_name").eq("id", memberRowId).single();
    expect(still.data?.full_name).toBe(`RLS Test ${stamp}`);

    const del = await nonStaff.from("plans").delete().eq("member_id", memberRowId).select("id");
    expect(del.data ?? []).toHaveLength(0);
  });

  it("non-staff can see only their own profile and cannot make themselves staff", async () => {
    const own = await nonStaff.from("profiles").select("id, role");
    expect(own.data).toHaveLength(1);
    expect(own.data?.[0]?.id).toBe(createdUsers[1]);

    await nonStaff.from("profiles").update({ role: "staff" }).eq("id", createdUsers[1]!);
    const after = await admin.from("profiles").select("role").eq("id", createdUsers[1]!).single();
    expect(after.data?.role).toBe("member");
  });

  it("non-staff cannot publish plans; is_staff() is false for them", async () => {
    const { data: plans } = await admin.from("plans").select("id").eq("member_id", memberRowId).limit(1);
    const r = await nonStaff.rpc("publish_plan", { p_plan_id: plans![0]!.id });
    expect(r.error).not.toBeNull();
    const s = await nonStaff.rpc("is_staff");
    expect(s.data).toBe(false);
  });

  it("anonymous cannot call functions", async () => {
    const r = await anon.rpc("is_staff");
    expect(r.error).not.toBeNull();
  });
});
