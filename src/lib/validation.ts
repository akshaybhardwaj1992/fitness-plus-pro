// Simple form validation. Same rules as the database CHECK constraints,
// but with plain-language messages. Pure — unit tested.
import {
  ACTIVITY_LEVELS, ALLERGEN_TAGS, DIET_TYPES, EXPERIENCES, FOOD_CATEGORIES, FOOD_ROLES, GOALS, MUSCLES, SEXES,
} from "@/lib/types";
import type { TablesInsert } from "@/lib/database.types";

export type FieldErrors = Record<string, string>;
export type Parsed<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

type FormLike = { get(name: string): FormDataEntryValue | null; getAll(name: string): FormDataEntryValue[] };

const str = (f: FormLike, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};

class Checker {
  errors: FieldErrors = {};
  constructor(private f: FormLike) {}

  text(k: string, label: string, opts: { required?: boolean; max?: number } = {}): string {
    const v = str(this.f, k);
    if (opts.required && !v) this.errors[k] = `Please enter ${label}.`;
    else if (opts.max && v.length > opts.max) this.errors[k] = `${label} is too long (max ${opts.max} characters).`;
    return v;
  }

  number(k: string, label: string, min: number, max: number, opts: { int?: boolean; required?: boolean } = {}): number | null {
    const raw = str(this.f, k);
    if (!raw) {
      if (opts.required !== false) this.errors[k] = `Please enter ${label}.`;
      return null;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) this.errors[k] = `${label} must be a number.`;
    else if (opts.int && !Number.isInteger(n)) this.errors[k] = `${label} must be a whole number.`;
    else if (n < min || n > max) this.errors[k] = `${label} must be between ${min} and ${max}.`;
    return n;
  }

  choice<T extends string>(k: string, label: string, options: readonly T[]): T {
    const v = str(this.f, k);
    if (!(options as readonly string[]).includes(v)) this.errors[k] = `Please choose ${label}.`;
    return v as T;
  }

  checkbox(k: string): boolean {
    const v = this.f.get(k);
    return v === "on" || v === "true" || v === "1";
  }

  multi<T extends string>(k: string, options: readonly T[]): T[] {
    return this.f
      .getAll(k)
      .filter((v): v is string => typeof v === "string")
      .filter((v): v is T => (options as readonly string[]).includes(v));
  }

  result<T>(data: T): Parsed<T> {
    return Object.keys(this.errors).length ? { ok: false, errors: this.errors } : { ok: true, data };
  }
}

export function parseMemberForm(f: FormLike): Parsed<Omit<TablesInsert<"members">, "id" | "created_by">> {
  const c = new Checker(f);
  const phone = c.text("phone", "phone", { max: 20 });
  if (phone && !/^[0-9+ -]{7,20}$/.test(phone)) c.errors.phone = "Phone can only have digits, spaces, + and - (7–20 characters).";
  const data = {
    full_name: c.text("full_name", "the member's name", { required: true, max: 120 }),
    phone: phone || null,
    age: c.number("age", "Age", 10, 100, { int: true }) ?? 0,
    sex: c.choice("sex", "sex", SEXES),
    height_cm: c.number("height_cm", "Height (cm)", 100, 250) ?? 0,
    weight_kg: c.number("weight_kg", "Weight (kg)", 25, 300) ?? 0,
    goal: c.choice("goal", "a goal", GOALS),
    activity_level: c.choice("activity_level", "an activity level", ACTIVITY_LEVELS),
    workouts_per_week: c.number("workouts_per_week", "Workouts per week", 0, 7, { int: true }) ?? 0,
    experience: c.choice("experience", "experience", EXPERIENCES),
    diet_type: c.choice("diet_type", "a diet type", DIET_TYPES),
    allergies: c.text("allergies", "Allergies", { max: 500 }),
    foods_to_avoid: c.text("foods_to_avoid", "Foods to avoid", { max: 500 }),
    daily_budget_inr: c.number("daily_budget_inr", "Daily food budget", 0, 100000, { required: false }),
    medical_notes: c.text("medical_notes", "Medical notes", { max: 2000 }),
    needs_professional_review: c.checkbox("needs_professional_review"),
  };
  return c.result(data);
}

export function parseFoodForm(f: FormLike): Parsed<Omit<TablesInsert<"foods">, "id">> {
  const c = new Checker(f);
  const data = {
    name: c.text("name", "a food name", { required: true, max: 120 }),
    category: c.choice("category", "a category", FOOD_CATEGORIES),
    diet_type: c.choice("diet_type", "a diet type", DIET_TYPES),
    serving_size_g: c.number("serving_size_g", "Serving size (g)", 1, 2000) ?? 0,
    serving_desc: c.text("serving_desc", "Serving description", { max: 80 }),
    kcal: c.number("kcal", "Calories", 0, 3000) ?? 0,
    protein_g: c.number("protein_g", "Protein", 0, 300) ?? 0,
    carbs_g: c.number("carbs_g", "Carbs", 0, 500) ?? 0,
    fat_g: c.number("fat_g", "Fat", 0, 300) ?? 0,
    fibre_g: c.number("fibre_g", "Fibre", 0, 100, { required: false }) ?? 0,
    allergens: c.multi("allergens", ALLERGEN_TAGS),
    roles: c.multi("roles", FOOD_ROLES),
    price_inr: c.number("price_inr", "Price", 0, 10000, { required: false }),
    source: c.text("source", "the source", { required: true, max: 200 }),
    verified: c.checkbox("verified"),
    is_active: c.checkbox("is_active"),
  };
  return c.result(data);
}

export function parseExerciseForm(f: FormLike): Parsed<Omit<TablesInsert<"exercises">, "id">> {
  const c = new Checker(f);
  const data = {
    name: c.text("name", "an exercise name", { required: true, max: 120 }),
    target_muscle: c.choice("target_muscle", "a target muscle", MUSCLES),
    equipment: c.text("equipment", "equipment", { max: 80 }) || "none",
    difficulty: c.choice("difficulty", "a difficulty", EXPERIENCES),
    default_sets: c.number("default_sets", "Sets", 1, 10, { int: true }) ?? 0,
    default_reps: c.text("default_reps", "reps", { required: true, max: 30 }),
    default_rest_sec: c.number("default_rest_sec", "Rest (seconds)", 0, 600, { int: true }) ?? 0,
    instructions: c.text("instructions", "Instructions", { max: 1000 }),
    is_active: c.checkbox("is_active"),
  };
  return c.result(data);
}

export function parseWeightForm(f: FormLike): Parsed<{ logged_on: string; weight_kg: number; note: string }> {
  const c = new Checker(f);
  const logged_on = c.text("logged_on", "a date", { required: true });
  if (logged_on && !/^\d{4}-\d{2}-\d{2}$/.test(logged_on)) c.errors.logged_on = "Please pick a valid date.";
  const data = {
    logged_on,
    weight_kg: c.number("weight_kg", "Weight (kg)", 25, 300) ?? 0,
    note: c.text("note", "Note", { max: 200 }),
  };
  return c.result(data);
}
