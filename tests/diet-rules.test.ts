import { describe, expect, it } from "vitest";
import { generateDietPlan, workoutDaySet } from "@/lib/nutrition/generator";
import { calorieBounds, checkDietPlan, dayTotal, foodConflicts, parseList } from "@/lib/nutrition/rules";
import { NUTRITION_RULES } from "@/lib/nutrition/config";
import type { DietPlanContent, DietType, Food, Goal, MemberForPlan, PlanItem } from "@/lib/types";
import { seedFoodsForTests } from "../data/toRows";

const FOODS = seedFoodsForTests();
const byId = new Map(FOODS.map((f) => [f.id, f]));

const base: MemberForPlan = {
  age: 30, sex: "male", height_cm: 175, weight_kg: 75, goal: "maintenance", activity_level: "moderate",
  workouts_per_week: 4, diet_type: "vegetarian", cooking_style: "simple", allergies: "", foods_to_avoid: "",
  daily_budget_inr: null, needs_professional_review: false,
};

function planOf(m: MemberForPlan, foods: Food[] = FOODS): DietPlanContent {
  const r = generateDietPlan(m, foods);
  if (!r.ok) throw new Error(`expected a plan, got: ${r.reasons.join(" | ")}`);
  return r.content;
}

const allItems = (p: DietPlanContent): PlanItem[] => p.days.flatMap((d) => d.meals.flatMap((m) => m.items));
const foodOf = (i: PlanItem): Food => byId.get(i.food_id!)!;

const ANIMAL_CATEGORIES = new Set(["dairy", "eggs", "meat", "fish"]);

describe("diet type", () => {
  it("vegan plans contain no animal foods", () => {
    for (const goal of ["fat_loss", "muscle_gain", "maintenance"] as Goal[]) {
      const p = planOf({ ...base, diet_type: "vegan", goal });
      for (const it of allItems(p)) {
        const f = foodOf(it);
        expect(f.diet_type, f.name).toBe("vegan");
        expect(ANIMAL_CATEGORIES.has(f.category), f.name).toBe(false);
        expect(f.allergens.includes("milk") || f.allergens.includes("egg") || f.allergens.includes("fish"), f.name).toBe(false);
      }
    }
  });

  it("vegetarian plans contain no eggs, meat or fish", () => {
    const p = planOf({ ...base, diet_type: "vegetarian" });
    for (const it of allItems(p)) {
      expect(["vegan", "vegetarian"]).toContain(foodOf(it).diet_type);
      expect(["eggs", "meat", "fish"]).not.toContain(foodOf(it).category);
    }
  });

  it("eggetarian plans contain no meat or fish", () => {
    const p = planOf({ ...base, diet_type: "eggetarian" });
    for (const it of allItems(p)) expect(["meat", "fish"]).not.toContain(foodOf(it).category);
  });
});

describe("allergies and foods to avoid", () => {
  it.each([
    ["peanuts", (f: Food) => f.allergens.includes("peanut")],
    ["milk", (f: Food) => f.allergens.includes("milk")],
    ["dairy", (f: Food) => f.allergens.includes("milk")],
    ["gluten", (f: Food) => f.allergens.includes("gluten")],
    ["wheat", (f: Food) => f.allergens.includes("gluten")],
    ["nuts", (f: Food) => f.allergens.includes("peanut") || f.allergens.includes("tree_nut")],
    ["soy", (f: Food) => f.allergens.includes("soy")],
  ])("allergy “%s” is never included", (allergy, isAllergen) => {
    for (const diet_type of ["vegan", "vegetarian", "non_vegetarian"] as DietType[]) {
      const r = generateDietPlan({ ...base, diet_type, allergies: allergy }, FOODS);
      if (!r.ok) continue; // refusing is allowed; including the allergen is not
      for (const it of allItems(r.content)) expect(isAllergen(foodOf(it)), `${allergy}: ${it.name}`).toBe(false);
    }
  });

  it("several allergies in free text are all excluded", () => {
    const p = planOf({ ...base, diet_type: "non_vegetarian", allergies: "Peanuts, fish and eggs; prawns" });
    for (const it of allItems(p)) {
      const f = foodOf(it);
      for (const tag of ["peanut", "fish", "egg", "shellfish"]) expect(f.allergens).not.toContain(tag);
    }
  });

  it("an allergy that is only a food name (e.g. banana) excludes that food", () => {
    const p = planOf({ ...base, allergies: "banana" });
    expect(allItems(p).some((i) => /banana/i.test(i.name))).toBe(false);
  });

  it("foods to avoid are excluded", () => {
    const p = planOf({ ...base, foods_to_avoid: "rice, paneer, rajma" });
    for (const it of allItems(p)) expect(it.name).not.toMatch(/\brice\b|paneer|rajma/i);
  });

  it("avoid word matches whole-word starts only (“oil” does not remove “boiled egg”)", () => {
    const egg = FOODS.find((f) => f.name === "Boiled egg")!;
    expect(foodConflicts(egg, { diet_type: "eggetarian", allergies: "", foods_to_avoid: "oil" })).toEqual([]);
  });

  it("parseList splits commas, semicolons, new lines and 'and'", () => {
    expect(parseList("Peanuts, milk and gluten;\nSoy / none")).toEqual(["peanuts", "milk", "gluten", "soy"]);
  });
});

describe("calories", () => {
  it("every day is within ±5% of the target and never below the floor (wide profile sweep)", () => {
    let plans = 0;
    for (const sex of ["male", "female"] as const)
      for (const weight_kg of [48, 70, 95])
        for (const goal of ["fat_loss", "muscle_gain", "maintenance", "general_fitness"] as Goal[])
          for (const activity_level of ["sedentary", "moderate", "very_active"] as const)
            for (const diet_type of ["vegan", "vegetarian", "eggetarian", "non_vegetarian"] as DietType[])
              for (const workouts_per_week of [0, 3, 6])
                for (const cooking_style of ["simple", "variety"] as const) {
                const m: MemberForPlan = {
                  ...base, sex, weight_kg, height_cm: sex === "male" ? 175 : 160, goal, activity_level, diet_type,
                  workouts_per_week, cooking_style,
                };
                const r = generateDietPlan(m, FOODS);
                expect(r.ok, `${JSON.stringify(m)} → ${r.ok ? "" : r.reasons.join(" ")}`).toBe(true);
                if (!r.ok) continue;
                plans++;
                const t = r.content.targets!;
                const [lo, hi] = calorieBounds(t);
                expect(lo).toBeGreaterThanOrEqual(t.calories * (1 - NUTRITION_RULES.calorieTolerance) - 0.001);
                for (const d of r.content.days) {
                  const kcal = dayTotal(d).kcal;
                  expect(kcal).toBeGreaterThanOrEqual(lo);
                  expect(kcal).toBeLessThanOrEqual(hi);
                  expect(kcal).toBeGreaterThanOrEqual(NUTRITION_RULES.calorieFloor[sex]);
                }
              }
    expect(plans).toBe(2 * 3 * 4 * 3 * 4 * 3 * 2);
  }, 120_000);
});

describe("structure", () => {
  it("7 days; workout days have 6 meals, rest days skip pre/post-workout", () => {
    const p = planOf({ ...base, workouts_per_week: 3 });
    expect(p.days).toHaveLength(7);
    const workout = workoutDaySet(3);
    for (const d of p.days) {
      const slots = d.meals.map((m) => m.slot);
      if (workout.has(d.day)) {
        expect(d.is_workout_day).toBe(true);
        expect(slots).toEqual(["breakfast", "mid_morning", "lunch", "pre_workout", "post_workout", "dinner"]);
      } else {
        expect(d.is_workout_day).toBe(false);
        expect(slots).toEqual(["breakfast", "mid_morning", "lunch", "dinner"]);
      }
    }
  });

  it("the same main dish is never used on consecutive days", () => {
    for (const diet_type of ["vegan", "vegetarian", "non_vegetarian"] as DietType[]) {
      const p = planOf({ ...base, diet_type });
      const mainsByDay = p.days.map(
        (d) => new Set(d.meals.filter((m) => m.slot === "lunch" || m.slot === "dinner").flatMap((m) =>
          m.items.filter((i) => foodOf(i).roles.includes("main_dish") && foodOf(i).category !== "grains").map((i) => i.food_id),
        )),
      );
      for (let i = 1; i < mainsByDay.length; i++) {
        for (const id of mainsByDay[i]!) expect(mainsByDay[i - 1]!.has(id), `${diet_type} day ${i}`).toBe(false);
      }
    }
  });

  it("is deterministic: same input → same plan", () => {
    const m = { ...base, diet_type: "eggetarian" as const, allergies: "peanut" };
    expect(JSON.stringify(planOf(m))).toBe(JSON.stringify(planOf(m)));
  });

  it("budget is preferred: a tight budget gives a cheaper plan than no budget", () => {
    const cost = (p: DietPlanContent) =>
      allItems(p).reduce((s, i) => s + (i.price_inr ?? 0) * i.servings, 0);
    const free = planOf({ ...base, diet_type: "non_vegetarian" });
    const cheap = planOf({ ...base, diet_type: "non_vegetarian", daily_budget_inr: 120 });
    expect(cost(cheap)).toBeLessThan(cost(free));
  });
});

describe("refuses instead of giving a wrong plan", () => {
  it("under 18", () => {
    const r = generateDietPlan({ ...base, age: 16 }, FOODS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join(" ")).toMatch(/needs trainer manual plan/i);
  });

  it("needs professional review", () => {
    const r = generateDietPlan({ ...base, needs_professional_review: true }, FOODS);
    expect(r.ok).toBe(false);
  });

  it("no foods at all → clear reasons", () => {
    const r = generateDietPlan(base, []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join(" ")).toMatch(/No allowed food/);
  });

  it("too few main dishes → explains why (variety needs 4, simple needs 2)", () => {
    const twoMains = FOODS.filter((f) => !f.roles.includes("main_dish") || /Toor|Moong dal, cooked/.test(f.name));
    const variety = generateDietPlan({ ...base, cooking_style: "variety" }, twoMains);
    expect(variety.ok).toBe(false);
    if (!variety.ok) expect(variety.reasons.join(" ")).toMatch(/main dish/);

    const oneMain = FOODS.filter((f) => !f.roles.includes("main_dish") || /Toor/.test(f.name));
    const simple = generateDietPlan({ ...base, cooking_style: "simple" }, oneMain);
    expect(simple.ok).toBe(false);
    if (!simple.ok) expect(simple.reasons.join(" ")).toMatch(/main dish/);
  });

  it("vegan + allergic to soy, gluten and all pulses' names → refuses or stays safe", () => {
    const m = { ...base, diet_type: "vegan" as const, allergies: "soy, gluten", foods_to_avoid: "dal, rajma, chole, sambar, lobia" };
    const r = generateDietPlan(m, FOODS);
    if (r.ok) {
      for (const it of allItems(r.content)) expect(foodConflicts(foodOf(it), m)).toEqual([]);
    } else {
      expect(r.reasons.length).toBeGreaterThan(0);
    }
  });
});

describe("plan check (used by the editor before publishing)", () => {
  it("flags an allergen added by hand", () => {
    const p = planOf({ ...base, allergies: "peanut" });
    const pb = FOODS.find((f) => f.name.startsWith("Peanut butter"))!;
    p.days[0]!.meals[0]!.items.push({
      food_id: pb.id, name: pb.name, servings: 1, serving_desc: pb.serving_desc, serving_size_g: pb.serving_size_g,
      per_serving: { kcal: pb.kcal, protein_g: pb.protein_g, carbs_g: pb.carbs_g, fat_g: pb.fat_g, fibre_g: pb.fibre_g },
      diet_type: pb.diet_type, category: pb.category, allergens: pb.allergens, price_inr: pb.price_inr, verified: false,
    });
    const c = checkDietPlan(p, { ...base, allergies: "peanut" }, { strict: false, foodsById: byId });
    expect(c.errors.join(" ")).toMatch(/allergy: peanut/);
  });

  it("manual edits below the floor are a warning (not strict) and an error (strict)", () => {
    const p = planOf(base);
    p.days[0]!.meals.forEach((m) => (m.items = []));
    expect(checkDietPlan(p, base, { strict: false }).warnings.join(" ")).toMatch(/safety minimum/);
    expect(checkDietPlan(p, base, { strict: true }).errors.join(" ")).toMatch(/safety minimum/);
  });
});

describe("simple cooking (one person cooking for themselves)", () => {
  const cookedIds = (d: DietPlanContent["days"][number], role: "main_dish" | "vegetable") =>
    new Set(
      d.meals
        .filter((m) => m.slot === "lunch" || m.slot === "dinner")
        .flatMap((m) => m.items)
        .filter((i) => foodOf(i).roles.includes(role) && !foodOf(i).roles.includes("side"))
        .map((i) => i.food_id),
    );

  it("cooks at most 1 dal/curry + 1 sabzi a day, eaten at both lunch and dinner", () => {
    for (const diet_type of ["vegan", "vegetarian", "eggetarian", "non_vegetarian"] as DietType[]) {
      const p = planOf({ ...base, diet_type, cooking_style: "simple" });
      for (const d of p.days) {
        expect(cookedIds(d, "main_dish").size, `${diet_type} day ${d.day} mains`).toBe(1);
        expect(cookedIds(d, "vegetable").size, `${diet_type} day ${d.day} sabzi`).toBeLessThanOrEqual(1);
        const lunch = d.meals.find((m) => m.slot === "lunch")!;
        const dinner = d.meals.find((m) => m.slot === "dinner")!;
        const main = (m: typeof lunch) => m.items.find((i) => foodOf(i).roles.includes("main_dish"))?.food_id;
        const staple = (m: typeof lunch) => m.items.find((i) => foodOf(i).roles.includes("staple"))?.food_id;
        expect(main(dinner)).toBe(main(lunch));
        expect(staple(dinner)).toBe(staple(lunch));
      }
    }
  });

  it("variety style may use different dishes at lunch and dinner", () => {
    const p = planOf({ ...base, cooking_style: "variety" });
    expect(p.days.some((d) => cookedIds(d, "main_dish").size === 2)).toBe(true);
  });
});

describe("realistic portions", () => {
  it("whole rotis, at least one breakfast dish and one pre-workout portion", () => {
    for (const cooking_style of ["simple", "variety"] as const) {
      const p = planOf({ ...base, cooking_style, weight_kg: 91, goal: "fat_loss" });
      for (const d of p.days)
        for (const m of d.meals)
          for (const i of m.items) {
            const f = foodOf(i);
            if (f.roles.includes("staple")) expect(Number.isInteger(i.servings), i.name).toBe(true);
            if (m.slot === "breakfast" && f.roles.includes("breakfast_main")) expect(i.servings).toBeGreaterThanOrEqual(1);
            if (m.slot === "pre_workout") expect(i.servings).toBeGreaterThanOrEqual(1);
          }
    }
  });
});

describe("protein", () => {
  it("91 kg vegetarian, fat loss (the case from the printed plan) gets close to the protein target", () => {
    const p = planOf({ ...base, age: 34, height_cm: 176, weight_kg: 91, goal: "fat_loss", activity_level: "light", workouts_per_week: 3 });
    const avg = p.days.reduce((s, d) => s + dayTotal(d).protein_g, 0) / 7;
    expect(avg).toBeGreaterThanOrEqual(p.targets!.protein_g * 0.95);
  });

  it("non-vegetarian and eggetarian plans meet the protein target on average", () => {
    for (const diet_type of ["eggetarian", "non_vegetarian"] as DietType[])
      for (const goal of ["fat_loss", "muscle_gain"] as Goal[]) {
        const p = planOf({ ...base, diet_type, goal, weight_kg: 80 });
        const avg = p.days.reduce((s, d) => s + dayTotal(d).protein_g, 0) / 7;
        expect(avg, `${diet_type} ${goal}`).toBeGreaterThanOrEqual(p.targets!.protein_g * 0.95);
      }
  });
});

describe("vegetables", () => {
  it("every day has a sabzi or salad at lunch", () => {
    for (const cooking_style of ["simple", "variety"] as const)
      for (const diet_type of ["vegan", "vegetarian", "non_vegetarian"] as DietType[]) {
        const p = planOf({ ...base, cooking_style, diet_type, weight_kg: 91, goal: "fat_loss" });
        for (const d of p.days) {
          const lunch = d.meals.find((m) => m.slot === "lunch")!;
          expect(lunch.items.some((i) => foodOf(i).category === "vegetables"), `${cooking_style} ${diet_type} day ${d.day}`).toBe(true);
        }
      }
  });
});
