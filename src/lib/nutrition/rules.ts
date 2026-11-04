// Food safety rules: diet type, allergies, foods to avoid, and plan checks.
// Pure functions — used by the generator, the editor (client) and the server.
import { NUTRITION_RULES as R, DAY_NAMES, REST_DAY_SLOTS, SLOT_LABELS } from "./config";
import type {
  AllergenTag, DietPlanContent, DietType, Food, FoodCategory, MemberForPlan, Nutrients, PlanItem, Targets,
} from "@/lib/types";

// ---------------------------------------------------------------- diet type

/** Food diet types each member diet type may eat. */
const ALLOWED: Record<DietType, DietType[]> = {
  vegan: ["vegan"],
  vegetarian: ["vegan", "vegetarian"],
  eggetarian: ["vegan", "vegetarian", "eggetarian"],
  non_vegetarian: ["vegan", "vegetarian", "eggetarian", "non_vegetarian"],
};

/** Categories that are animal products, as a second guard on top of diet_type. */
const ANIMAL_CATEGORIES: Record<DietType, FoodCategory[]> = {
  vegan: ["dairy", "eggs", "meat", "fish"],
  vegetarian: ["eggs", "meat", "fish"],
  eggetarian: ["meat", "fish"],
  non_vegetarian: [],
};

export function dietTypeAllows(member: DietType, food: Pick<Food, "diet_type" | "category">): boolean {
  return ALLOWED[member].includes(food.diet_type) && !ANIMAL_CATEGORIES[member].includes(food.category);
}

// ---------------------------------------------------------------- free-text lists

/** "Peanuts, milk and gluten" → ["peanuts", "milk", "gluten"] */
export function parseList(text: string | null | undefined): string[] {
  if (!text) return [];
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[,;\n/]|\band\b|&/)
        .map((s) => s.trim().replace(/\s+/g, " "))
        .filter((s) => s.length >= 2 && !["none", "nil", "no", "na", "n/a", "-"].includes(s)),
    ),
  );
}

/** Words people write → allergen tags. Deliberately broad: when unsure, exclude more. */
const ALLERGY_ALIASES: Record<string, AllergenTag[]> = {
  milk: ["milk"], dairy: ["milk"], lactose: ["milk"], cheese: ["milk"], paneer: ["milk"], curd: ["milk"],
  dahi: ["milk"], yogurt: ["milk"], yoghurt: ["milk"], ghee: ["milk"], butter: ["milk"], whey: ["milk"],
  cream: ["milk"], casein: ["milk"],
  egg: ["egg"], eggs: ["egg"],
  peanut: ["peanut"], peanuts: ["peanut"], groundnut: ["peanut"], groundnuts: ["peanut"], moongphali: ["peanut"],
  nut: ["peanut", "tree_nut"], nuts: ["peanut", "tree_nut"],
  "tree nut": ["tree_nut"], "tree nuts": ["tree_nut"], almond: ["tree_nut"], almonds: ["tree_nut"],
  badam: ["tree_nut"], cashew: ["tree_nut"], cashews: ["tree_nut"], kaju: ["tree_nut"], walnut: ["tree_nut"],
  walnuts: ["tree_nut"], pistachio: ["tree_nut"], pista: ["tree_nut"],
  soy: ["soy"], soya: ["soy"], soybean: ["soy"], tofu: ["soy"],
  gluten: ["gluten"], wheat: ["gluten"], atta: ["gluten"], maida: ["gluten"], barley: ["gluten"],
  rye: ["gluten"], oats: ["gluten"], celiac: ["gluten"], coeliac: ["gluten"],
  fish: ["fish"], seafood: ["fish", "shellfish"], shellfish: ["shellfish"], prawn: ["shellfish"],
  prawns: ["shellfish"], shrimp: ["shellfish"], crab: ["shellfish"],
  sesame: ["sesame"], til: ["sesame"], mustard: ["mustard"],
};

export function allergyTagsFor(term: string): AllergenTag[] {
  const direct = ALLERGY_ALIASES[term];
  if (direct) return direct;
  // "peanut allergy", "mild lactose intolerance" → look at each word
  const tags = new Set<AllergenTag>();
  for (const word of term.split(" ")) for (const t of ALLERGY_ALIASES[word] ?? []) tags.add(t);
  return Array.from(tags);
}

type FoodLike = Pick<Food, "name" | "category" | "diet_type" | "allergens">;

/** Term matches the start of a word in the food name or category ("oil" does not match "boiled"). */
function nameMatches(food: FoodLike, term: string): boolean {
  const hay = `${food.name} ${food.category.replace("_", " ")}`.toLowerCase();
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}`).test(hay);
}

/** Every reason this food must not be given to this member (empty = OK). */
export function foodConflicts(
  food: FoodLike,
  member: Pick<MemberForPlan, "diet_type" | "allergies" | "foods_to_avoid">,
): string[] {
  const reasons: string[] = [];
  if (!dietTypeAllows(member.diet_type, food)) {
    reasons.push(`not ${member.diet_type.replace("_", "-")}`);
  }
  for (const term of parseList(member.allergies)) {
    const tags = allergyTagsFor(term);
    if (tags.some((t) => food.allergens.includes(t)) || nameMatches(food, term)) {
      reasons.push(`allergy: ${term}`);
    }
  }
  for (const term of parseList(member.foods_to_avoid)) {
    if (nameMatches(food, term)) reasons.push(`avoid: ${term}`);
  }
  return reasons;
}

/** Allergy words that match no allergen tag and no food name — staff must check by hand. */
export function unrecognisedAllergies(member: Pick<MemberForPlan, "allergies">, foods: FoodLike[]): string[] {
  return parseList(member.allergies).filter(
    (term) => allergyTagsFor(term).length === 0 && !foods.some((f) => nameMatches(f, term)),
  );
}

// ---------------------------------------------------------------- nutrient maths

export const ZERO: Nutrients = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0 };

export function itemNutrients(item: Pick<PlanItem, "servings" | "per_serving">): Nutrients {
  const s = item.servings;
  const p = item.per_serving;
  return {
    kcal: p.kcal * s,
    protein_g: p.protein_g * s,
    carbs_g: p.carbs_g * s,
    fat_g: p.fat_g * s,
    fibre_g: p.fibre_g * s,
  };
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  return list.reduce(
    (a, b) => ({
      kcal: a.kcal + b.kcal,
      protein_g: a.protein_g + b.protein_g,
      carbs_g: a.carbs_g + b.carbs_g,
      fat_g: a.fat_g + b.fat_g,
      fibre_g: a.fibre_g + b.fibre_g,
    }),
    ZERO,
  );
}

export function itemsTotal(items: PlanItem[]): Nutrients {
  return sumNutrients(items.map(itemNutrients));
}

export function dayTotal(day: DietPlanContent["days"][number]): Nutrients {
  return sumNutrients(day.meals.map((m) => itemsTotal(m.items)));
}

export function dayCost(day: DietPlanContent["days"][number]): { cost: number; unknown: number } {
  let cost = 0;
  let unknown = 0;
  for (const meal of day.meals) {
    for (const it of meal.items) {
      if (it.price_inr == null) unknown++;
      else cost += it.price_inr * it.servings;
    }
  }
  return { cost, unknown };
}

export function calorieBounds(t: Pick<Targets, "calories" | "calorie_floor">): [number, number] {
  return [Math.max(t.calories * (1 - R.calorieTolerance), t.calorie_floor), t.calories * (1 + R.calorieTolerance)];
}

export function foodToItem(food: Food, servings: number): PlanItem {
  return {
    food_id: food.id,
    name: food.name,
    servings,
    serving_desc: food.serving_desc,
    serving_size_g: food.serving_size_g,
    per_serving: {
      kcal: food.kcal,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      fibre_g: food.fibre_g,
    },
    diet_type: food.diet_type,
    category: food.category,
    allergens: [...food.allergens],
    price_inr: food.price_inr,
    verified: food.verified,
  };
}

// ---------------------------------------------------------------- plan check

export interface PlanCheck {
  /** Must be fixed: unsafe foods, or (strict mode) calories out of range. Blocks publishing. */
  errors: string[];
  /** Worth a look but allowed. */
  warnings: string[];
}

/**
 * Independent check of a whole diet plan against the member.
 * `strict` = generated plans: calorie range and floor are errors, not warnings.
 * `foodsById` lets the check use the current food data (e.g. allergens added later).
 */
export function checkDietPlan(
  content: DietPlanContent,
  member: MemberForPlan,
  opts: { strict: boolean; foodsById?: Map<string, Food> },
): PlanCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const t = content.targets;

  for (const day of content.days) {
    const dayName = DAY_NAMES[day.day] ?? `Day ${day.day + 1}`;
    for (const meal of day.meals) {
      if (!day.is_workout_day && !REST_DAY_SLOTS.includes(meal.slot) && meal.items.length > 0 && opts.strict) {
        errors.push(`${dayName}: rest day should not have a ${SLOT_LABELS[meal.slot]} meal.`);
      }
      for (const item of meal.items) {
        const current = item.food_id ? opts.foodsById?.get(item.food_id) : undefined;
        const food: FoodLike = current ?? {
          name: item.name, category: item.category, diet_type: item.diet_type, allergens: item.allergens,
        };
        const conflicts = foodConflicts(food, member);
        if (conflicts.length > 0) {
          errors.push(`${dayName}, ${SLOT_LABELS[meal.slot]}: “${item.name}” — ${conflicts.join(", ")}.`);
        }
        if (!(item.servings > 0)) {
          errors.push(`${dayName}, ${SLOT_LABELS[meal.slot]}: “${item.name}” has no quantity.`);
        }
      }
    }

    if (t) {
      const kcal = dayTotal(day).kcal;
      const [lo, hi] = calorieBounds(t);
      if (kcal < t.calorie_floor) {
        const msg = `${dayName}: ${Math.round(kcal)} kcal is below the safety minimum of ${t.calorie_floor} kcal.`;
        if (opts.strict) errors.push(msg);
        else warnings.push(msg);
      } else if (kcal < lo - 0.5 || kcal > hi + 0.5) {
        const msg = `${dayName}: ${Math.round(kcal)} kcal is outside ±${R.calorieTolerance * 100}% of the ${t.calories} kcal target.`;
        if (opts.strict) errors.push(msg);
        else warnings.push(msg);
      }
    }
  }
  return { errors, warnings };
}
