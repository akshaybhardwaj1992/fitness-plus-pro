// Converts SEED DATA (per 100 g) into database rows (per serving).
import { SEED_FOODS, type SeedFood } from "./foods";
import { SEED_EXERCISES } from "./exercises";
import type { Exercise, Food } from "../src/lib/types";

const r1 = (n: number) => Math.round(n * 10) / 10;

export function seedFoodToRow(s: SeedFood): Omit<Food, "id"> {
  const k = s.serving_size_g / 100;
  const [kcal, protein, carbs, fat, fibre] = s.per100;
  return {
    name: s.name,
    category: s.category,
    diet_type: s.diet_type,
    serving_size_g: s.serving_size_g,
    serving_desc: s.serving_desc,
    kcal: r1(kcal * k),
    protein_g: r1(protein * k),
    carbs_g: r1(carbs * k),
    fat_g: r1(fat * k),
    fibre_g: r1(fibre * k),
    allergens: [...s.allergens],
    roles: [...s.roles],
    price_inr: s.price_inr,
    source: `SEED: ${s.source}`,
    verified: false,
    is_active: true,
  };
}

/** Seed foods with fake ids — for unit tests that run the real generator on the real seed list. */
export function seedFoodsForTests(): Food[] {
  return SEED_FOODS.map((s, i) => ({ id: `seed-food-${i}`, ...seedFoodToRow(s) }));
}

export function seedExercisesForTests(): Exercise[] {
  return SEED_EXERCISES.map((s, i) => ({ id: `seed-ex-${i}`, ...s, is_active: true }));
}
