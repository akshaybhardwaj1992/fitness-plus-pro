// Shared domain types. Plain data only — safe to import from client and server.

export type Sex = "male" | "female";
export type Goal = "fat_loss" | "muscle_gain" | "maintenance" | "general_fitness";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active";
export type Experience = "beginner" | "intermediate" | "advanced";
export type DietType = "vegetarian" | "eggetarian" | "non_vegetarian" | "vegan";

export const SEXES: readonly Sex[] = ["male", "female"];
export const GOALS: readonly Goal[] = ["fat_loss", "muscle_gain", "maintenance", "general_fitness"];
export const ACTIVITY_LEVELS: readonly ActivityLevel[] = ["sedentary", "light", "moderate", "very_active"];
export const EXPERIENCES: readonly Experience[] = ["beginner", "intermediate", "advanced"];
export const DIET_TYPES: readonly DietType[] = ["vegetarian", "eggetarian", "non_vegetarian", "vegan"];

export const FOOD_CATEGORIES = [
  "grains", "pulses", "dairy", "eggs", "meat", "fish", "soy",
  "vegetables", "fruits", "nuts_seeds", "breakfast", "snacks", "beverages",
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

/** Which part of a meal a food can fill. Used by the diet generator. */
export const FOOD_ROLES = [
  "breakfast_main", "protein_side", "fruit", "snack", "staple",
  "main_dish", "vegetable", "side", "quick_carb", "protein_snack",
] as const;
export type FoodRole = (typeof FOOD_ROLES)[number];

/** Allergen tags stored on foods. */
export const ALLERGEN_TAGS = [
  "milk", "egg", "peanut", "tree_nut", "soy", "gluten", "fish", "shellfish", "sesame", "mustard",
] as const;
export type AllergenTag = (typeof ALLERGEN_TAGS)[number];

export const MUSCLES = ["chest", "back", "shoulders", "biceps", "triceps", "legs", "abs", "cardio"] as const;
export type Muscle = (typeof MUSCLES)[number];

export interface Member {
  id: string;
  full_name: string;
  phone: string | null;
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  goal: Goal;
  activity_level: ActivityLevel;
  workouts_per_week: number;
  experience: Experience;
  diet_type: DietType;
  allergies: string;
  foods_to_avoid: string;
  daily_budget_inr: number | null;
  medical_notes: string;
  needs_professional_review: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Fields the diet engine needs from a member. */
export type MemberForPlan = Pick<
  Member,
  | "age" | "sex" | "height_cm" | "weight_kg" | "goal" | "activity_level" | "workouts_per_week"
  | "diet_type" | "allergies" | "foods_to_avoid" | "daily_budget_inr" | "needs_professional_review"
>;

/** A food row. Nutrient values are per ONE serving of serving_size_g grams. */
export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  diet_type: DietType;
  serving_size_g: number;
  serving_desc: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  allergens: string[];
  roles: string[];
  price_inr: number | null;
  source: string;
  verified: boolean;
  is_active: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  target_muscle: Muscle;
  equipment: string;
  difficulty: Experience;
  default_sets: number;
  default_reps: string;
  default_rest_sec: number;
  instructions: string;
  is_active: boolean;
}

export interface WeightLog {
  id: string;
  member_id: string;
  logged_on: string;
  weight_kg: number;
  note: string;
}

// ---------------- plan content (stored in plans.content JSON) ----------------

export type MealSlot = "breakfast" | "mid_morning" | "lunch" | "pre_workout" | "post_workout" | "dinner";
export const MEAL_SLOTS: readonly MealSlot[] = [
  "breakfast", "mid_morning", "lunch", "pre_workout", "post_workout", "dinner",
];

export interface Nutrients {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
}

/** One food in a meal. Keeps a snapshot of the food so old plans stay readable. */
export interface PlanItem {
  food_id: string | null;
  name: string;
  servings: number;
  serving_desc: string;
  serving_size_g: number;
  per_serving: Nutrients;
  diet_type: DietType;
  category: FoodCategory;
  allergens: string[];
  price_inr: number | null;
  verified: boolean;
}

export interface DietMeal {
  slot: MealSlot;
  items: PlanItem[];
}

export interface DietDay {
  day: number; // 0 = Monday … 6 = Sunday
  is_workout_day: boolean;
  meals: DietMeal[];
}

export interface Targets {
  bmr: number;
  tdee: number;
  calories: number;
  calorie_floor: number;
  floor_applied: boolean;
  protein_g: number;
  protein_range_g: [number, number];
  fat_g: number;
  fat_range_g: [number, number];
  carbs_g: number;
  notes: string[];
}

export interface DietPlanContent {
  kind: "diet";
  version: 1;
  generated: boolean;
  targets: Targets | null;
  days: DietDay[];
  notes: string;
  warnings: string[];
}

export interface WorkoutItem {
  exercise_id: string | null;
  name: string;
  target_muscle: Muscle;
  sets: number;
  reps: string;
  rest_sec: number;
  notes: string;
}

export interface WorkoutDay {
  name: string;
  exercises: WorkoutItem[];
}

export interface WorkoutPlanContent {
  kind: "workout";
  version: 1;
  template: string | null;
  days: WorkoutDay[];
  notes: string;
}

export type PlanType = "diet" | "workout";
export type PlanStatus = "draft" | "published";

export interface PlanRow {
  id: string;
  member_id: string;
  type: PlanType;
  title: string;
  status: PlanStatus;
  content: unknown;
  created_at: string;
  updated_at: string;
}
