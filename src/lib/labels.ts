// Plain-language labels for the screens.
import type {
  ActivityLevel, AllergenTag, CookingStyle, DietType, Experience, FoodCategory, FoodRole, Goal, Muscle, Sex,
} from "@/lib/types";

export const SEX_LABELS: Record<Sex, string> = { male: "Male", female: "Female" };

export const GOAL_LABELS: Record<Goal, string> = {
  fat_loss: "Fat loss",
  muscle_gain: "Muscle gain",
  maintenance: "Maintenance",
  general_fitness: "General fitness",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little walking)",
  light: "Light (walks, light exercise 1–3 days)",
  moderate: "Moderate (exercise 3–5 days)",
  very_active: "Very active (hard exercise 6–7 days / physical job)",
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const DIET_LABELS: Record<DietType, string> = {
  vegetarian: "Vegetarian (no egg)",
  eggetarian: "Eggetarian",
  non_vegetarian: "Non-vegetarian",
  vegan: "Vegan",
};

export const COOKING_LABELS: Record<CookingStyle, string> = {
  simple: "Simple — 1 dal/curry + 1 sabzi a day (same for lunch & dinner)",
  variety: "More variety — different dishes at lunch and dinner",
};

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  grains: "Grains / roti / rice",
  pulses: "Dals & pulses",
  dairy: "Dairy",
  eggs: "Eggs",
  meat: "Meat",
  fish: "Fish & seafood",
  soy: "Soy",
  vegetables: "Vegetables",
  fruits: "Fruits",
  nuts_seeds: "Nuts & seeds",
  breakfast: "Breakfast dishes",
  snacks: "Snacks",
  beverages: "Drinks",
};

export const ROLE_LABELS: Record<FoodRole, string> = {
  breakfast_main: "Breakfast dish",
  protein_side: "Protein side (breakfast)",
  fruit: "Fruit",
  snack: "Snack",
  staple: "Roti / rice (staple)",
  main_dish: "Main dish (dal, curry…)",
  vegetable: "Vegetable / sabzi",
  side: "Side (curd, salad…)",
  quick_carb: "Quick energy (pre-workout)",
  protein_snack: "Protein (post-workout)",
};

export const ALLERGEN_LABELS: Record<AllergenTag, string> = {
  milk: "Milk / dairy",
  egg: "Egg",
  peanut: "Peanut",
  tree_nut: "Tree nuts",
  soy: "Soy",
  gluten: "Gluten / wheat",
  fish: "Fish",
  shellfish: "Shellfish",
  sesame: "Sesame",
  mustard: "Mustard",
};

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  legs: "Legs",
  abs: "Abs",
  cardio: "Cardio",
};

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export function fmtDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };

/** 2.5 → "2½", 0.5 → "½", 3 → "3", 1.25 → "1¼". */
export function fmtQty(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const rest = Math.round((n - whole) * 100) / 100;
  const frac = Object.entries(FRACTIONS).find(([, v]) => Math.abs(v - rest) < 0.01)?.[0];
  if (rest === 0) return String(whole);
  if (frac) return whole === 0 ? frac : `${whole}${frac}`;
  return fmt(n, 2);
}

/**
 * How much to eat, in kitchen words: servings 2.5 of "1 katori" → "2½ katori";
 * 2 of "½ katori (100 g cooked)" → "1 katori"; 1.5 of "2 small chilla" → "3 small chilla".
 * Falls back to "1½ × about 15 almonds" when the description has no leading amount.
 */
export function fmtPortion(servings: number, desc: string, servingSizeG: number): string {
  const text = desc.trim() || `${servingSizeG} g`;
  if (servings === 1) return text;
  const m = /^(\d+(?:\.\d+)?)?\s*([½¼¾])?\s+(.*)$/.exec(text);
  const lead = m ? Number(m[1] ?? 0) + (m[2] ? FRACTIONS[m[2]]! : 0) : 0;
  if (!m || lead === 0 || /^[-–]/.test(m[3]!)) return `${fmtQty(servings)} × ${text}`;
  const rest = m[3]!.replace(/\s*\([^)]*\)/g, "").trim();
  return `${fmtQty(lead * servings)} ${rest}`;
}
