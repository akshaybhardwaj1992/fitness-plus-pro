// Row → domain object mappers. The database CHECK constraints guarantee the
// text columns hold valid values, so the casts below are safe.
import type { Tables } from "@/lib/database.types";
import type {
  ActivityLevel, CookingStyle, DietPlanContent, DietType, Exercise, Experience, Food, FoodCategory, Goal, Member, Muscle,
  PlanRow, PlanStatus, PlanType, Sex, WeightLog, WorkoutPlanContent,
} from "@/lib/types";

const num = (v: number | string | null | undefined): number => Number(v ?? 0);
const numOrNull = (v: number | string | null | undefined): number | null => (v == null ? null : Number(v));

export function toMember(r: Tables<"members">): Member {
  return {
    id: r.id,
    full_name: r.full_name,
    phone: r.phone,
    age: r.age,
    sex: r.sex as Sex,
    height_cm: num(r.height_cm),
    weight_kg: num(r.weight_kg),
    goal: r.goal as Goal,
    activity_level: r.activity_level as ActivityLevel,
    workouts_per_week: r.workouts_per_week,
    experience: r.experience as Experience,
    diet_type: r.diet_type as DietType,
    cooking_style: r.cooking_style as CookingStyle,
    allergies: r.allergies,
    foods_to_avoid: r.foods_to_avoid,
    daily_budget_inr: numOrNull(r.daily_budget_inr),
    medical_notes: r.medical_notes,
    needs_professional_review: r.needs_professional_review,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export function toFood(r: Tables<"foods">): Food {
  return {
    id: r.id,
    name: r.name,
    category: r.category as FoodCategory,
    diet_type: r.diet_type as DietType,
    serving_size_g: num(r.serving_size_g),
    serving_desc: r.serving_desc,
    kcal: num(r.kcal),
    protein_g: num(r.protein_g),
    carbs_g: num(r.carbs_g),
    fat_g: num(r.fat_g),
    fibre_g: num(r.fibre_g),
    allergens: r.allergens ?? [],
    roles: r.roles ?? [],
    price_inr: numOrNull(r.price_inr),
    source: r.source,
    verified: r.verified,
    is_active: r.is_active,
  };
}

export function toExercise(r: Tables<"exercises">): Exercise {
  return {
    id: r.id,
    name: r.name,
    target_muscle: r.target_muscle as Muscle,
    equipment: r.equipment,
    difficulty: r.difficulty as Experience,
    default_sets: r.default_sets,
    default_reps: r.default_reps,
    default_rest_sec: r.default_rest_sec,
    instructions: r.instructions,
    is_active: r.is_active,
  };
}

export function toWeightLog(r: Tables<"weight_logs">): WeightLog {
  return { id: r.id, member_id: r.member_id, logged_on: r.logged_on, weight_kg: num(r.weight_kg), note: r.note };
}

export function toPlan(r: Tables<"plans">): PlanRow {
  return {
    id: r.id,
    member_id: r.member_id,
    type: r.type as PlanType,
    title: r.title,
    status: r.status as PlanStatus,
    content: r.content,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/** Reads plan JSON defensively — returns null if it is not a diet plan we understand. */
export function asDietContent(c: unknown): DietPlanContent | null {
  if (typeof c !== "object" || c === null) return null;
  const o = c as Partial<DietPlanContent>;
  if (o.kind !== "diet" || !Array.isArray(o.days)) return null;
  return {
    kind: "diet", version: 1, generated: Boolean(o.generated), targets: o.targets ?? null,
    days: o.days, notes: typeof o.notes === "string" ? o.notes : "", warnings: Array.isArray(o.warnings) ? o.warnings : [],
  };
}

export function asWorkoutContent(c: unknown): WorkoutPlanContent | null {
  if (typeof c !== "object" || c === null) return null;
  const o = c as Partial<WorkoutPlanContent>;
  if (o.kind !== "workout" || !Array.isArray(o.days)) return null;
  return {
    kind: "workout", version: 1, template: o.template ?? null, days: o.days,
    notes: typeof o.notes === "string" ? o.notes : "",
  };
}
