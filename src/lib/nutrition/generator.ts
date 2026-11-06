// Deterministic 7-day diet plan generator. No AI, no randomness:
// the same member + the same food list always give the same plan.
import {
  DAY_NAMES, MEAL_PATTERNS, MIN_BREAKFAST_MAINS, MIN_MAIN_DISHES, NUTRITION_RULES as R, PROTEIN_FIRST_ROLES,
  REST_DAY_SLOTS, ROLE_SERVING_LIMITS, SERVING_STEP, SHARED_DISH_ROLES_SIMPLE, STAPLE_MIN_FOR_HIGHER_CALORIES,
  WHOLE_SERVING_ROLES, WORKOUT_DAY_SHARES,
  WORKOUT_DAY_SLOTS, WORKOUT_DAYS_BY_COUNT, restDayShares,
} from "./config";
import { calculateTargets, checkAutoPlanEligibility } from "./calc";
import {
  calorieBounds, checkDietPlan, dayCost, dayTotal, foodConflicts, foodToItem, unrecognisedAllergies,
} from "./rules";
import type {
  CookingStyle, DietDay, DietPlanContent, Food, FoodRole, MealSlot, MemberForPlan, Targets,
} from "@/lib/types";

export type GenerateResult =
  | { ok: true; content: DietPlanContent }
  | { ok: false; reasons: string[] };

const ROLE_LABELS: Record<FoodRole, string> = {
  breakfast_main: "breakfast dish",
  protein_side: "protein side",
  fruit: "fruit",
  snack: "snack",
  staple: "roti/rice",
  main_dish: "main dish (dal, curry…)",
  vegetable: "vegetable",
  side: "side (curd, salad…)",
  quick_carb: "quick energy food",
  protein_snack: "protein snack",
};

/** Max local-search steps per day — keeps the run time bounded. */
const MAX_SEARCH_STEPS = 400;
/** Different starting rotations tried per day before giving up. */
const MAX_ATTEMPTS = 6;

export function workoutDaySet(workoutsPerWeek: number): Set<number> {
  const n = Math.max(0, Math.min(7, Math.round(workoutsPerWeek)));
  return new Set(WORKOUT_DAYS_BY_COUNT[n]);
}

/** Empty 7-day structure for a plan the trainer fills in by hand. */
export function emptyDietDays(workoutsPerWeek: number): DietDay[] {
  const workout = workoutDaySet(workoutsPerWeek);
  return Array.from({ length: 7 }, (_, d) => ({
    day: d,
    is_workout_day: workout.has(d),
    meals: (workout.has(d) ? WORKOUT_DAY_SLOTS : REST_DAY_SLOTS).map((slot) => ({ slot, items: [] })),
  }));
}

// ---------------------------------------------------------------- food pools

/** Price per 100 kcal, or null if unknown. */
function pricePer100Kcal(f: Food): number | null {
  if (f.price_inr == null || f.kcal <= 0) return null;
  return f.price_inr / (f.kcal / 100);
}

const proteinDensity = (f: Food) => (f.kcal > 0 ? f.protein_g / f.kcal : 0);

/**
 * Candidates for a role.
 *  1. With a budget: only "within budget" foods, when there are enough of them for variety.
 *  2. Protein-first roles: the more protein-rich half of the foods, best first, so plans
 *     reach the protein target (e.g. soya chunks / moong dal before dal makhani / aloo paratha).
 */
function buildPool(
  foods: Food[], role: FoodRole, budget: number | null, calories: number, style: CookingStyle,
): Food[] {
  const needed = role === "main_dish" ? MIN_MAIN_DISHES[style] + 1 : 2;
  let pool = foods.filter((f) => f.roles.includes(role));
  if (budget && budget > 0) {
    const limit = budget / (calories / 100); // ₹ per 100 kcal if the whole day cost exactly the budget
    const affordable = pool.filter((f) => {
      const p = pricePer100Kcal(f);
      return p == null || p <= limit;
    });
    if (affordable.length >= needed) pool = affordable;
  }
  if (PROTEIN_FIRST_ROLES.includes(role)) {
    const keep = Math.max(needed + 1, Math.ceil(pool.length / 2));
    pool = [...pool]
      .sort((a, b) => proteinDensity(b) - proteinDensity(a) || a.name.localeCompare(b.name))
      .slice(0, keep);
  }
  return pool;
}

function pick(pool: Food[], seed: number, banned: Set<string>): Food | null {
  for (let i = 0; i < pool.length; i++) {
    const f = pool[(seed + i) % pool.length]!;
    if (!banned.has(f.id)) return f;
  }
  return null;
}

// ---------------------------------------------------------------- one day

interface Slotted {
  slot: MealSlot;
  role: FoodRole;
  food: Food;
  servings: number;
  /** Optional parts (fruit, sides, extra protein) may be dropped (0 servings) when a day does not fit. */
  optional: boolean;
  /** Lowest allowed servings (role limit, raised for staples on higher-calorie plans). */
  min: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const roundStep = (n: number) => Math.round(n / SERVING_STEP) * SERVING_STEP;

function totals(items: Slotted[]) {
  let kcal = 0, protein = 0, fat = 0;
  for (const it of items) {
    kcal += it.food.kcal * it.servings;
    protein += it.food.protein_g * it.servings;
    fat += it.food.fat_g * it.servings;
  }
  return { kcal, protein, fat };
}

/** Lower is better: stay inside the calorie range (hard), then calories, meal balance, protein, fat. */
function score(items: Slotted[], targets: Targets, slotTargets: Map<MealSlot, number>): number {
  const t = totals(items);
  const cal = targets.calories;
  const [lo, hi] = calorieBounds(targets);
  let s = Math.abs(t.kcal - cal) / cal;
  // Leaving the allowed range costs far more than any protein or balance gain.
  s += (20 * (Math.max(0, lo - t.kcal) + Math.max(0, t.kcal - hi))) / cal;

  const bySlot = new Map<MealSlot, number>();
  for (const it of items) bySlot.set(it.slot, (bySlot.get(it.slot) ?? 0) + it.food.kcal * it.servings);
  for (const [slot, target] of slotTargets) s += (0.25 * Math.abs((bySlot.get(slot) ?? 0) - target)) / cal;

  s += (1.5 * Math.max(0, targets.protein_g - t.protein)) / targets.protein_g;
  s += (0.3 * Math.max(0, t.fat - targets.fat_range_g[1])) / targets.fat_range_g[1];
  return s;
}

const stepOf = (it: Slotted) => (WHOLE_SERVING_ROLES.includes(it.role) ? 1 : SERVING_STEP);

/** The next allowed serving count up or down, or null. Optional items can go from their minimum to 0 and back. */
function nextServing(it: Slotted, dir: 1 | -1): number | null {
  const lo = it.min;
  const hi = ROLE_SERVING_LIMITS[it.role][1];
  if (it.servings === 0) return dir > 0 ? lo : null;
  const to = it.servings + dir * stepOf(it);
  if (to > hi) return null;
  if (to < lo) return it.optional ? 0 : null;
  return to;
}

/**
 * Nudge servings one step at a time until nothing improves the score. Tries single changes
 * first, then swaps (one food up, another down) — a swap lets the plan trade,
 * say, rice for dal to add protein without moving calories off target.
 */
function tune(items: Slotted[], targets: Targets, slotTargets: Map<MealSlot, number>): void {
  let current = score(items, targets, slotTargets);
  for (let step = 0; step < MAX_SEARCH_STEPS; step++) {
    let best: { moves: [number, number][]; s: number } | null = null;
    const consider = (moves: [number, number][]) => {
      const prev = moves.map(([i]) => items[i]!.servings);
      for (const [i, to] of moves) items[i]!.servings = to;
      const s = score(items, targets, slotTargets);
      moves.forEach(([i], k) => (items[i]!.servings = prev[k]!));
      if (s < current - 1e-9 && (!best || s < best.s)) best = { moves, s };
    };

    for (let i = 0; i < items.length; i++) {
      for (const dir of [1, -1] as const) {
        const to = nextServing(items[i]!, dir);
        if (to !== null) consider([[i, to]]);
      }
    }
    if (!best) {
      for (let i = 0; i < items.length; i++) {
        const up = nextServing(items[i]!, 1);
        if (up === null) continue;
        for (let j = 0; j < items.length; j++) {
          const down = nextServing(items[j]!, -1);
          if (i !== j && down !== null) consider([[i, up], [j, down]]);
        }
      }
    }
    if (!best) return;
    for (const [i, to] of (best as { moves: [number, number][] }).moves) items[i]!.servings = to;
    current = (best as { s: number }).s;
  }
}

interface DayContext {
  dayIndex: number;
  isWorkoutDay: boolean;
  attempt: number;
  pools: Map<FoodRole, Food[]>;
  targets: Targets;
  style: CookingStyle;
  yesterdayMains: Set<string>;
  yesterdayBreakfast: Set<string>;
}

function buildDay(ctx: DayContext): { day: DietDay; mains: Set<string>; breakfast: Set<string> } | null {
  const slots = ctx.isWorkoutDay ? WORKOUT_DAY_SLOTS : REST_DAY_SLOTS;
  const shares: Partial<Record<MealSlot, number>> = ctx.isWorkoutDay ? WORKOUT_DAY_SHARES : restDayShares();
  const slotTargets = new Map<MealSlot, number>(slots.map((s) => [s, (shares[s] ?? 0) * ctx.targets.calories]));

  const todayMains = new Set<string>();
  const todayBreakfast = new Set<string>();
  const items: Slotted[] = [];
  // Simple cooking: the dal/curry and sabzi picked for lunch are eaten again at dinner.
  const cookedToday = new Map<FoodRole, Food>();
  const shareDishes = ctx.style === "simple";

  slots.forEach((slot, slotIdx) => {
    const inMeal = new Set<string>();
    const mealItems: Slotted[] = [];
    MEAL_PATTERNS[slot].forEach((comp, compIdx) => {
      const shared = shareDishes && SHARED_DISH_ROLES_SIMPLE.includes(comp.role);
      const reuse = shared ? cookedToday.get(comp.role) : undefined;
      if (reuse && inMeal.has(reuse.id)) return; // already in this meal under another role
      const pool = ctx.pools.get(comp.role) ?? [];
      const banned = new Set(inMeal);
      if (comp.role === "main_dish") for (const id of [...ctx.yesterdayMains, ...todayMains]) banned.add(id);
      if (comp.role === "breakfast_main") for (const id of ctx.yesterdayBreakfast) banned.add(id);
      const seed = ctx.dayIndex + slotIdx * 7 + compIdx * 3 + ctx.attempt * 5;
      const food = reuse ?? pick(pool, seed, banned);
      if (food && shared) cookedToday.set(comp.role, food);
      if (!food) return; // required parts are checked below
      inMeal.add(food.id);
      if (comp.role === "main_dish") todayMains.add(food.id);
      if (comp.role === "breakfast_main") todayBreakfast.add(food.id);
      const staplesUp = comp.role === "staple" && ctx.targets.calories >= STAPLE_MIN_FOR_HIGHER_CALORIES.fromKcal;
      const min = staplesUp ? STAPLE_MIN_FOR_HIGHER_CALORIES.minServings : ROLE_SERVING_LIMITS[comp.role][0];
      mealItems.push({ slot, role: comp.role, food, servings: 1, optional: !comp.required, min });
    });

    // Starting quantities: scale the whole meal toward its calorie share.
    const base = mealItems.reduce((s, it) => s + it.food.kcal, 0);
    const factor = base > 0 ? (slotTargets.get(slot) ?? 0) / base : 1;
    for (const it of mealItems) {
      const lo = it.min;
      const hi = ROLE_SERVING_LIMITS[it.role][1];
      it.servings = clamp(WHOLE_SERVING_ROLES.includes(it.role) ? Math.round(factor) : roundStep(factor), lo, hi);
    }
    items.push(...mealItems);
  });

  // Every required part must be present.
  for (const slot of slots) {
    for (const comp of MEAL_PATTERNS[slot]) {
      if (comp.required && !items.some((it) => it.slot === slot && it.role === comp.role)) return null;
    }
  }

  tune(items, ctx.targets, slotTargets);

  const kcal = totals(items).kcal;
  const [lo, hi] = calorieBounds(ctx.targets);
  if (kcal < lo || kcal > hi) return null;

  const day: DietDay = {
    day: ctx.dayIndex,
    is_workout_day: ctx.isWorkoutDay,
    meals: slots.map((slot) => ({
      slot,
      items: items.filter((it) => it.slot === slot && it.servings > 0).map((it) => foodToItem(it.food, it.servings)),
    })),
  };
  return { day, mains: todayMains, breakfast: todayBreakfast };
}

// ---------------------------------------------------------------- whole plan

export function generateDietPlan(member: MemberForPlan, allFoods: Food[]): GenerateResult {
  const eligibility = checkAutoPlanEligibility(member);
  if (!eligibility.ok) return { ok: false, reasons: [eligibility.message] };

  const targets = calculateTargets(member);
  const usable = allFoods
    .filter((f) => f.is_active && f.kcal > 0 && foodConflicts(f, member).length === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const style: CookingStyle = member.cooking_style ?? "simple";
  const minMains = MIN_MAIN_DISHES[style];
  const workoutDays = workoutDaySet(member.workouts_per_week);
  const slotsUsed = new Set<MealSlot>(workoutDays.size > 0 ? WORKOUT_DAY_SLOTS : REST_DAY_SLOTS);

  const pools = new Map<FoodRole, Food[]>();
  for (const slot of slotsUsed) {
    for (const comp of MEAL_PATTERNS[slot]) {
      if (!pools.has(comp.role)) {
        pools.set(comp.role, buildPool(usable, comp.role, member.daily_budget_inr, targets.calories, style));
      }
    }
  }

  // ---- can a valid plan exist at all? Explain clearly if not.
  const excluded = allFoods.filter((f) => f.is_active).length - usable.length;
  const reasons: string[] = [];
  const missing = new Set<FoodRole>();
  for (const slot of slotsUsed) {
    for (const comp of MEAL_PATTERNS[slot]) {
      if (comp.required && (pools.get(comp.role)?.length ?? 0) === 0) missing.add(comp.role);
    }
  }
  for (const role of missing) {
    reasons.push(`No allowed food for “${ROLE_LABELS[role]}”. Add one in the Food list that suits this member.`);
  }
  const mains = pools.get("main_dish")?.length ?? 0;
  if (!missing.has("main_dish") && mains < minMains) {
    reasons.push(
      `Only ${mains} main dish(es) fit this member; at least ${minMains} are needed so dishes don't repeat on back-to-back days.`,
    );
  }
  const breakfasts = pools.get("breakfast_main")?.length ?? 0;
  if (!missing.has("breakfast_main") && breakfasts < MIN_BREAKFAST_MAINS) {
    reasons.push(`Only ${breakfasts} breakfast dish(es) fit this member; at least ${MIN_BREAKFAST_MAINS} are needed.`);
  }
  if (reasons.length > 0) {
    if (excluded > 0) {
      reasons.push(`${excluded} food(s) were left out because of diet type, allergies or foods to avoid.`);
    }
    return { ok: false, reasons };
  }

  // ---- build the week
  const days: DietDay[] = [];
  let yesterdayMains = new Set<string>();
  let yesterdayBreakfast = new Set<string>();
  for (let d = 0; d < 7; d++) {
    let built: ReturnType<typeof buildDay> = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !built; attempt++) {
      built = buildDay({
        dayIndex: d, isWorkoutDay: workoutDays.has(d), attempt, pools, targets, style, yesterdayMains, yesterdayBreakfast,
      });
    }
    if (!built) {
      return {
        ok: false,
        reasons: [
          `Could not fit ${DAY_NAMES[d]} within ±${R.calorieTolerance * 100}% of ${targets.calories} kcal using the allowed foods.`,
          "Add more foods that suit this member, or build the plan by hand.",
        ],
      };
    }
    days.push(built.day);
    yesterdayMains = built.mains;
    yesterdayBreakfast = built.breakfast;
  }

  // ---- warnings (plan is still valid)
  const warnings: string[] = [...targets.notes];
  for (const term of unrecognisedAllergies(member, allFoods)) {
    warnings.push(`Allergy “${term}” is not a known allergen and matched no food name — check this plan by hand.`);
  }
  const avgProtein = days.reduce((s, d) => s + dayTotal(d).protein_g, 0) / days.length;
  if (avgProtein < targets.protein_range_g[0]) {
    warnings.push(
      `Average protein is ${Math.round(avgProtein)} g/day, below the ${targets.protein_range_g[0]} g minimum. ` +
        "Add a protein food by hand (e.g. low-fat paneer, soya chunks, curd), or 1 scoop of whey if the trainer recommends it.",
    );
  }
  if (member.daily_budget_inr && member.daily_budget_inr > 0) {
    const avgCost = days.reduce((s, d) => s + dayCost(d).cost, 0) / days.length;
    if (avgCost > member.daily_budget_inr) {
      warnings.push(`Estimated cost is about ₹${Math.round(avgCost)}/day, above the ₹${member.daily_budget_inr} budget.`);
    }
  }
  const unverified = new Set(
    days.flatMap((d) => d.meals.flatMap((m) => m.items.filter((i) => !i.verified).map((i) => i.name))),
  );
  if (unverified.size > 0) {
    warnings.push(`${unverified.size} food(s) in this plan have nutrition values not yet verified by staff.`);
  }

  const content: DietPlanContent = {
    kind: "diet", version: 1, generated: true, targets, days, notes: "", warnings,
  };

  // ---- final independent safety check: never output a wrong plan
  const check = checkDietPlan(content, member, { strict: true });
  if (check.errors.length > 0) {
    return { ok: false, reasons: ["The generated plan failed a safety check:", ...check.errors] };
  }
  return { ok: true, content };
}
