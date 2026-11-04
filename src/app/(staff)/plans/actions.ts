"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import type { FormState } from "@/lib/form";
import type { Json } from "@/lib/database.types";
import type { ServerSupabase } from "@/lib/supabase/server";
import { asDietContent, asWorkoutContent, toExercise, toFood, toMember, toPlan } from "@/lib/data";
import { calculateTargets, checkAutoPlanEligibility } from "@/lib/nutrition/calc";
import { emptyDietDays, generateDietPlan } from "@/lib/nutrition/generator";
import { checkDietPlan } from "@/lib/nutrition/rules";
import { buildWorkoutFromTemplate, getTemplate } from "@/lib/workout/templates";
import { MUSCLES, type DietPlanContent, type PlanStatus, type WorkoutPlanContent } from "@/lib/types";

export type CreateState = { reasons: string[] };

const today = () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const MAX_CONTENT_CHARS = 400_000;
/** Plan content is a plain object; store it in the JSON column. */
const toJson = (c: DietPlanContent | WorkoutPlanContent) => c as unknown as NonNullable<Json>;

async function loadMember(supabase: ServerSupabase, id: string) {
  const { data } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  return data ? toMember(data) : null;
}

async function loadFoods(supabase: ServerSupabase) {
  const { data, error } = await supabase.from("foods").select("*");
  if (error) throw new Error(`Could not load foods: ${error.message}`);
  return (data ?? []).map(toFood);
}

// ---------------------------------------------------------------- create

export async function createDietPlan(_prev: CreateState, formData: FormData): Promise<CreateState> {
  const supabase = await requireStaff();
  const memberId = String(formData.get("member_id") ?? "");
  const mode = formData.get("mode") === "auto" ? "auto" : "blank";
  const member = await loadMember(supabase, memberId);
  if (!member) return { reasons: ["Member not found."] };

  let content: DietPlanContent;
  if (mode === "auto") {
    const result = generateDietPlan(member, await loadFoods(supabase));
    if (!result.ok) return { reasons: result.reasons };
    content = result.content;
  } else {
    const eligibility = checkAutoPlanEligibility(member);
    content = {
      kind: "diet",
      version: 1,
      generated: false,
      targets: eligibility.ok ? calculateTargets(member) : null,
      days: emptyDietDays(member.workouts_per_week),
      notes: "",
      warnings: eligibility.ok ? [] : [eligibility.message],
    };
  }

  const { data, error } = await supabase
    .from("plans")
    .insert({
      member_id: member.id,
      type: "diet",
      title: `Diet plan — ${today()}`,
      content: toJson(content),
    })
    .select("id")
    .single();
  if (error) return { reasons: [`Could not save the plan: ${error.message}`] };
  revalidatePath(`/members/${member.id}`);
  redirect(`/plans/${data.id}/edit`);
}

export async function createWorkoutPlan(_prev: CreateState, formData: FormData): Promise<CreateState> {
  const supabase = await requireStaff();
  const memberId = String(formData.get("member_id") ?? "");
  const templateKey = String(formData.get("template") ?? "");
  const member = await loadMember(supabase, memberId);
  if (!member) return { reasons: ["Member not found."] };

  let content: WorkoutPlanContent;
  let title = "Workout plan";
  if (templateKey === "blank") {
    content = { kind: "workout", version: 1, template: null, days: [{ name: "Day 1", exercises: [] }], notes: "" };
  } else {
    const template = getTemplate(templateKey);
    if (!template) return { reasons: ["Please choose a template."] };
    const { data, error } = await supabase.from("exercises").select("*");
    if (error) return { reasons: [`Could not load exercises: ${error.message}`] };
    content = buildWorkoutFromTemplate(template, (data ?? []).map(toExercise)).content;
    title = template.label;
  }

  const { data, error } = await supabase
    .from("plans")
    .insert({ member_id: member.id, type: "workout", title: `${title} — ${today()}`, content: toJson(content) })
    .select("id")
    .single();
  if (error) return { reasons: [`Could not save the plan: ${error.message}`] };
  revalidatePath(`/members/${member.id}`);
  redirect(`/plans/${data.id}/edit`);
}

// ---------------------------------------------------------------- save / publish

export interface SaveResult {
  ok: boolean;
  message: string;
  errors: string[];
  warnings: string[];
  status: PlanStatus;
}

/** Light shape-check of workout JSON coming from the browser. */
function cleanWorkout(c: WorkoutPlanContent): WorkoutPlanContent {
  return {
    ...c,
    notes: String(c.notes ?? "").slice(0, 2000),
    days: c.days.slice(0, 14).map((d) => ({
      name: String(d.name ?? "").slice(0, 80) || "Day",
      exercises: (Array.isArray(d.exercises) ? d.exercises : []).slice(0, 40).map((x) => ({
        exercise_id: typeof x.exercise_id === "string" ? x.exercise_id : null,
        name: String(x.name ?? "").slice(0, 120),
        target_muscle: (MUSCLES as readonly string[]).includes(x.target_muscle) ? x.target_muscle : "abs",
        sets: Math.min(20, Math.max(1, Math.round(Number(x.sets) || 1))),
        reps: String(x.reps ?? "").slice(0, 30),
        rest_sec: Math.min(600, Math.max(0, Math.round(Number(x.rest_sec) || 0))),
        notes: String(x.notes ?? "").slice(0, 200),
      })),
    })),
  };
}

async function checkPlan(supabase: ServerSupabase, memberId: string, content: DietPlanContent) {
  const member = await loadMember(supabase, memberId);
  if (!member) return { errors: ["Member not found."], warnings: [] };
  const foods = await loadFoods(supabase);
  return checkDietPlan(content, member, { strict: false, foodsById: new Map(foods.map((f) => [f.id, f])) });
}

export async function savePlan(input: { id: string; title: string; content: unknown }): Promise<SaveResult> {
  const supabase = await requireStaff();
  const { data: row } = await supabase.from("plans").select("*").eq("id", input.id).maybeSingle();
  if (!row) return { ok: false, message: "Plan not found.", errors: [], warnings: [], status: "draft" };
  const plan = toPlan(row);
  const title = String(input.title ?? "").trim().slice(0, 120);

  if (JSON.stringify(input.content).length > MAX_CONTENT_CHARS) {
    return { ok: false, message: "This plan is too large to save.", errors: [], warnings: [], status: plan.status };
  }

  let content: DietPlanContent | WorkoutPlanContent | null;
  let errors: string[] = [];
  let warnings: string[] = [];
  if (plan.type === "diet") {
    content = asDietContent(input.content);
    if (content) ({ errors, warnings } = await checkPlan(supabase, plan.member_id, content));
  } else {
    const w = asWorkoutContent(input.content);
    content = w ? cleanWorkout(w) : null;
  }
  if (!content) return { ok: false, message: "The plan data is not valid.", errors: [], warnings: [], status: plan.status };

  // A published plan with safety problems goes back to draft so members never see it.
  const status: PlanStatus = errors.length > 0 ? "draft" : plan.status;
  const { error } = await supabase
    .from("plans")
    .update({ title, content: toJson(content), status })
    .eq("id", plan.id);
  if (error) return { ok: false, message: `Could not save: ${error.message}`, errors, warnings, status: plan.status };

  revalidatePath(`/members/${plan.member_id}`);
  revalidatePath(`/plans/${plan.id}/print`);
  const message =
    status !== plan.status
      ? "Saved, but moved back to Draft because of the problems listed below."
      : "Saved.";
  return { ok: true, message, errors, warnings, status };
}

export async function publishPlan(id: string): Promise<SaveResult> {
  const supabase = await requireStaff();
  const { data: row } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  if (!row) return { ok: false, message: "Plan not found.", errors: [], warnings: [], status: "draft" };
  const plan = toPlan(row);

  let warnings: string[] = [];
  if (plan.type === "diet") {
    const content = asDietContent(plan.content);
    if (!content) return { ok: false, message: "The plan data is not valid.", errors: [], warnings: [], status: plan.status };
    const check = await checkPlan(supabase, plan.member_id, content);
    warnings = check.warnings;
    if (check.errors.length > 0) {
      return { ok: false, message: "Cannot publish — fix these problems first:", errors: check.errors, warnings, status: plan.status };
    }
  }

  const { error } = await supabase.rpc("publish_plan", { p_plan_id: plan.id });
  if (error) return { ok: false, message: `Could not publish: ${error.message}`, errors: [], warnings, status: plan.status };
  revalidatePath(`/members/${plan.member_id}`);
  return { ok: true, message: "Published. This is now the member's current plan.", errors: [], warnings, status: "published" };
}

export async function unpublishPlan(id: string): Promise<SaveResult> {
  const supabase = await requireStaff();
  const { data, error } = await supabase.from("plans").update({ status: "draft" }).eq("id", id).select("member_id").single();
  if (error) return { ok: false, message: `Could not change status: ${error.message}`, errors: [], warnings: [], status: "published" };
  revalidatePath(`/members/${data.member_id}`);
  return { ok: true, message: "Moved back to Draft.", errors: [], warnings: [], status: "draft" };
}

/** Navigates on the client (redirectTo), like the member forms — see FormState. */
export async function deletePlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const { data, error } = await supabase.from("plans").delete().eq("id", id).select("member_id").single();
  if (error) return { errors: {}, message: `Could not delete the plan: ${error.message}` };
  return { errors: {}, message: null, redirectTo: `/members/${data.member_id}` };
}
