import { describe, expect, it } from "vitest";
import { SEED_FOODS } from "../data/foods";
import { SEED_EXERCISES } from "../data/exercises";
import { seedExercisesForTests, seedFoodsForTests } from "../data/toRows";
import { WORKOUT_TEMPLATES, buildWorkoutFromTemplate, suggestTemplate } from "@/lib/workout/templates";
import { MUSCLES } from "@/lib/types";

describe("seed foods", () => {
  it("has 80–100 foods with unique names", () => {
    expect(SEED_FOODS.length).toBeGreaterThanOrEqual(80);
    expect(SEED_FOODS.length).toBeLessThanOrEqual(100);
    const names = SEED_FOODS.map((f) => f.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("every row is marked as seed data and unverified", () => {
    for (const f of seedFoodsForTests()) {
      expect(f.verified).toBe(false);
      expect(f.source).toMatch(/^SEED: /);
    }
  });

  it("calories roughly match protein/carbs/fat (catches typos; Atwater 4/4/9 within 15% or 8 kcal)", () => {
    for (const f of SEED_FOODS) {
      const [kcal, p, c, fat] = f.per100;
      const diff = Math.abs(4 * p + 4 * c + 9 * fat - kcal);
      expect(diff <= 8 || diff / kcal < 0.15, `${f.name}: off by ${diff.toFixed(1)} kcal`).toBe(true);
    }
  });

  it("animal foods are tagged with the right diet type", () => {
    for (const f of SEED_FOODS) {
      if (f.category === "meat" || f.category === "fish") expect(f.diet_type, f.name).toBe("non_vegetarian");
      if (f.category === "eggs") expect(f.diet_type, f.name).toBe("eggetarian");
      if (f.category === "dairy" || f.allergens.includes("milk")) expect(["vegetarian", "non_vegetarian"], f.name).toContain(f.diet_type);
      if (f.diet_type === "vegan") {
        for (const tag of ["milk", "egg", "fish", "shellfish"] as const) expect(f.allergens, f.name).not.toContain(tag);
      }
    }
  });

  it("obvious allergens are tagged", () => {
    for (const f of SEED_FOODS) {
      const n = f.name.toLowerCase();
      if (/paneer|curd|milk|raita|kadhi|makhani|yogurt|buttermilk/.test(n) && !/soy milk/.test(n)) expect(f.allergens, f.name).toContain("milk");
      if (/egg/.test(n)) expect(f.allergens, f.name).toContain("egg");
      if (/peanut/.test(n)) expect(f.allergens, f.name).toContain("peanut");
      if (/tofu|soy/.test(n)) expect(f.allergens, f.name).toContain("soy");
      if (/roti \(whole wheat|bread|upma|dalia|thepla|paratha|sandwich/.test(n)) expect(f.allergens, f.name).toContain("gluten");
    }
  });
});

describe("seed exercises and templates", () => {
  it("about 50 exercises covering all 8 muscle groups, unique names", () => {
    expect(SEED_EXERCISES.length).toBeGreaterThanOrEqual(50);
    for (const m of MUSCLES) expect(SEED_EXERCISES.some((e) => e.target_muscle === m), m).toBe(true);
    const names = SEED_EXERCISES.map((e) => e.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("every template exercise exists in the seed list", () => {
    const ex = seedExercisesForTests();
    for (const t of WORKOUT_TEMPLATES) {
      const { missing, content } = buildWorkoutFromTemplate(t, ex);
      expect(missing, t.key).toEqual([]);
      expect(content.days.length).toBe(t.days.length);
    }
  });

  it("has the four required templates", () => {
    expect(WORKOUT_TEMPLATES.map((t) => t.key)).toEqual([
      "beginner_full_body_3", "upper_lower_4", "split_5", "general_fitness",
    ]);
  });

  it("suggests a template that fits the member", () => {
    expect(suggestTemplate({ goal: "fat_loss", experience: "beginner", workouts_per_week: 3 })).toBe("beginner_full_body_3");
    expect(suggestTemplate({ goal: "muscle_gain", experience: "intermediate", workouts_per_week: 4 })).toBe("upper_lower_4");
    expect(suggestTemplate({ goal: "muscle_gain", experience: "advanced", workouts_per_week: 5 })).toBe("split_5");
    expect(suggestTemplate({ goal: "general_fitness", experience: "beginner", workouts_per_week: 3 })).toBe("general_fitness");
  });
});
