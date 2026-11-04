// =====================================================================
// ALL diet rules live in this one file. Change numbers here, nowhere else.
// =====================================================================
import type { ActivityLevel, FoodRole, Goal, MealSlot, Sex } from "@/lib/types";

export const NUTRITION_RULES = {
  /** Auto-generation only for adults. Younger members need a manual plan. */
  minAdultAge: 18,

  /** TDEE = BMR × multiplier (Mifflin-St Jeor BMR). */
  activityMultipliers: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  } satisfies Record<ActivityLevel, number>,

  /** Change from TDEE by goal (−0.15 = 15% below TDEE). */
  goalAdjustment: {
    fat_loss: -0.15,
    muscle_gain: 0.1,
    maintenance: 0,
    general_fitness: 0,
  } satisfies Record<Goal, number>,

  /** A deficit never goes deeper than this, whatever goalAdjustment says. */
  maxDeficit: 0.2,

  /** Calories never go below these numbers. */
  calorieFloor: { female: 1200, male: 1500 } satisfies Record<Sex, number>,

  /** Protein in grams per kg of body weight: [min, max]. Target = middle. */
  proteinGPerKg: {
    fat_loss: [1.6, 2.2],
    muscle_gain: [1.6, 2.2],
    maintenance: [1.2, 1.6],
    general_fitness: [1.2, 1.6],
  } satisfies Record<Goal, [number, number]>,

  /** Fat as a share of calories: [min, max] and the target. */
  fatShareRange: [0.2, 0.3] as [number, number],
  fatShareTarget: 0.25,

  /** If protein + fat leave fewer carbs than this, protein is lowered (not below its min). */
  minCarbsG: 90,

  /** A generated day must be within ±5% of the calorie target. */
  calorieTolerance: 0.05,

  /** Energy per gram. */
  kcalPerGram: { protein: 4, carbs: 4, fat: 9 },
} as const;

/** Share of daily calories per meal on a workout day. Must add up to 1. */
export const WORKOUT_DAY_SHARES: Record<MealSlot, number> = {
  breakfast: 0.22,
  mid_morning: 0.1,
  lunch: 0.25,
  pre_workout: 0.1,
  post_workout: 0.13,
  dinner: 0.2,
};

/** Rest days skip pre/post-workout meals; their calories are spread over the other meals. */
export const REST_DAY_SLOTS: MealSlot[] = ["breakfast", "mid_morning", "lunch", "dinner"];
export const WORKOUT_DAY_SLOTS: MealSlot[] = [
  "breakfast", "mid_morning", "lunch", "pre_workout", "post_workout", "dinner",
];

export function restDayShares(): Partial<Record<MealSlot, number>> {
  const total = REST_DAY_SLOTS.reduce((s, slot) => s + WORKOUT_DAY_SHARES[slot], 0);
  const out: Partial<Record<MealSlot, number>> = {};
  for (const slot of REST_DAY_SLOTS) out[slot] = WORKOUT_DAY_SHARES[slot] / total;
  return out;
}

/** What goes into each meal. `required` parts must be fillable or the plan fails. */
export interface MealComponent {
  role: FoodRole;
  required: boolean;
}

export const MEAL_PATTERNS: Record<MealSlot, MealComponent[]> = {
  breakfast: [
    { role: "breakfast_main", required: true },
    { role: "protein_side", required: false },
    { role: "fruit", required: false },
  ],
  mid_morning: [
    { role: "snack", required: true },
    { role: "fruit", required: false },
  ],
  lunch: [
    { role: "staple", required: true },
    { role: "main_dish", required: true },
    { role: "vegetable", required: false },
    { role: "side", required: false },
  ],
  pre_workout: [{ role: "quick_carb", required: true }],
  post_workout: [
    { role: "protein_snack", required: true },
    { role: "quick_carb", required: false },
  ],
  dinner: [
    { role: "staple", required: true },
    { role: "main_dish", required: true },
    { role: "vegetable", required: false },
  ],
};

/** Servings allowed per food in each role: [min, max]. Changes go in 0.5 steps. */
export const ROLE_SERVING_LIMITS: Record<FoodRole, [number, number]> = {
  breakfast_main: [0.5, 3],
  protein_side: [0.5, 2],
  fruit: [0.5, 2],
  snack: [0.5, 2],
  staple: [0.5, 4],
  main_dish: [0.5, 2.5],
  vegetable: [0.5, 2],
  side: [0.5, 2],
  quick_carb: [0.5, 2],
  protein_snack: [0.5, 2.5],
};
export const SERVING_STEP = 0.5;

/** Need at least this many different main dishes to avoid repeats on consecutive days. */
export const MIN_MAIN_DISHES = 4;
export const MIN_BREAKFAST_MAINS = 2;

/** Which weekdays (0 = Monday) are workout days, by workouts per week. */
export const WORKOUT_DAYS_BY_COUNT: Record<number, number[]> = {
  0: [],
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  mid_morning: "Mid-morning snack",
  lunch: "Lunch",
  pre_workout: "Pre-workout",
  post_workout: "Post-workout",
  dinner: "Dinner",
};
