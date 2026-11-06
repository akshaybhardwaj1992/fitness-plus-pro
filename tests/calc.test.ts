import { describe, expect, it } from "vitest";
import { calculateTargets, checkAutoPlanEligibility, mifflinStJeorBmr } from "@/lib/nutrition/calc";
import { NUTRITION_RULES } from "@/lib/nutrition/config";
import type { MemberForPlan } from "@/lib/types";

const base: MemberForPlan = {
  age: 30, sex: "male", height_cm: 180, weight_kg: 80, goal: "maintenance", activity_level: "sedentary",
  workouts_per_week: 3, diet_type: "vegetarian", cooking_style: "simple", allergies: "", foods_to_avoid: "", daily_budget_inr: null,
  needs_professional_review: false,
};

describe("Mifflin-St Jeor BMR", () => {
  it("male: 10w + 6.25h − 5a + 5", () => {
    expect(mifflinStJeorBmr("male", 80, 180, 30)).toBe(1780);
  });
  it("female: 10w + 6.25h − 5a − 161", () => {
    // 600 + 1000 − 125 − 161 = 1314
    expect(mifflinStJeorBmr("female", 60, 160, 25)).toBe(1314);
  });
});

describe("TDEE and goal calories", () => {
  it.each([
    ["sedentary", 1.2],
    ["light", 1.375],
    ["moderate", 1.55],
    ["very_active", 1.725],
  ] as const)("activity %s uses multiplier %d", (activity, mult) => {
    const t = calculateTargets({ ...base, activity_level: activity });
    expect(t.tdee).toBe(Math.round(1780 * mult));
  });

  it("maintenance = TDEE (rounded to 10)", () => {
    const t = calculateTargets(base);
    expect(t.calories).toBe(Math.round((1780 * 1.2) / 10) * 10);
  });

  it("fat loss = TDEE − 15%", () => {
    const t = calculateTargets({ ...base, goal: "fat_loss", activity_level: "moderate" });
    expect(t.calories).toBe(Math.round((1780 * 1.55 * 0.85) / 10) * 10);
  });

  it("muscle gain = TDEE + 10%", () => {
    const t = calculateTargets({ ...base, goal: "muscle_gain", activity_level: "moderate" });
    expect(t.calories).toBe(Math.round((1780 * 1.55 * 1.1) / 10) * 10);
  });

  it("fat-loss deficit never exceeds the 20% cap", () => {
    expect(NUTRITION_RULES.maxDeficit).toBe(0.2);
    const t = calculateTargets({ ...base, goal: "fat_loss", activity_level: "very_active" });
    expect(t.calories).toBeGreaterThanOrEqual(t.tdee * 0.8 - 5);
  });
});

describe("safety floors", () => {
  it("women never below 1200 kcal", () => {
    const t = calculateTargets({
      ...base, sex: "female", weight_kg: 45, height_cm: 150, age: 60, goal: "fat_loss", activity_level: "sedentary",
    });
    expect(t.calories).toBe(1200);
    expect(t.floor_applied).toBe(true);
    expect(t.notes.join(" ")).toMatch(/safety minimum/);
  });

  it("men never below 1500 kcal", () => {
    const t = calculateTargets({
      ...base, weight_kg: 50, height_cm: 155, age: 65, goal: "fat_loss", activity_level: "sedentary",
    });
    expect(t.calories).toBe(1500);
    expect(t.floor_applied).toBe(true);
  });

  it("no profile in a wide sweep ever goes below its floor", () => {
    for (const sex of ["male", "female"] as const)
      for (const weight_kg of [40, 60, 90, 140])
        for (const height_cm of [140, 165, 195])
          for (const age of [18, 40, 80])
            for (const goal of ["fat_loss", "muscle_gain", "maintenance", "general_fitness"] as const)
              for (const activity_level of ["sedentary", "light", "moderate", "very_active"] as const) {
                const t = calculateTargets({ ...base, sex, weight_kg, height_cm, age, goal, activity_level });
                expect(t.calories).toBeGreaterThanOrEqual(NUTRITION_RULES.calorieFloor[sex]);
              }
  });
});

describe("macros", () => {
  it("protein 1.6–2.2 g/kg for fat loss and muscle gain", () => {
    for (const goal of ["fat_loss", "muscle_gain"] as const) {
      const t = calculateTargets({ ...base, goal, activity_level: "moderate" });
      expect(t.protein_range_g).toEqual([128, 176]);
      expect(t.protein_g).toBeGreaterThanOrEqual(128);
      expect(t.protein_g).toBeLessThanOrEqual(176);
    }
  });

  it("protein 1.2–1.6 g/kg otherwise", () => {
    for (const goal of ["maintenance", "general_fitness"] as const) {
      const t = calculateTargets({ ...base, goal });
      expect(t.protein_range_g).toEqual([96, 128]);
      expect(t.protein_g).toBeGreaterThanOrEqual(96);
      expect(t.protein_g).toBeLessThanOrEqual(128);
    }
  });

  it("protein target sits at the configured point of the range (default: the minimum)", () => {
    const t = calculateTargets({ ...base, weight_kg: 91, goal: "fat_loss", activity_level: "light" });
    const [lo, hi] = t.protein_range_g;
    expect(t.protein_g).toBe(Math.round(lo + (hi - lo) * NUTRITION_RULES.proteinTargetPosition));
  });

  it("fat 20–30% of calories, carbs are the remainder, total adds up", () => {
    const t = calculateTargets({ ...base, goal: "muscle_gain", activity_level: "moderate" });
    const fatShare = (t.fat_g * 9) / t.calories;
    expect(fatShare).toBeGreaterThanOrEqual(0.2 - 0.01);
    expect(fatShare).toBeLessThanOrEqual(0.3 + 0.01);
    const total = t.protein_g * 4 + t.fat_g * 9 + t.carbs_g * 4;
    expect(Math.abs(total - t.calories)).toBeLessThanOrEqual(8);
  });

  it("heavy member on a low target: protein lowered but never below its minimum, carbs never negative", () => {
    const t = calculateTargets({
      ...base, sex: "female", weight_kg: 140, height_cm: 150, age: 70, goal: "fat_loss", activity_level: "sedentary",
    });
    expect(t.protein_g).toBeGreaterThanOrEqual(t.protein_range_g[0]);
    expect(t.carbs_g).toBeGreaterThanOrEqual(0);
  });
});

describe("eligibility", () => {
  it("under 18 → needs trainer manual plan", () => {
    const e = checkAutoPlanEligibility({ age: 17, needs_professional_review: false });
    expect(e.ok).toBe(false);
    if (!e.ok) {
      expect(e.code).toBe("under_18");
      expect(e.message).toMatch(/needs trainer manual plan/i);
    }
    expect(() => calculateTargets({ ...base, age: 17 })).toThrow();
  });

  it("needs professional review → blocked", () => {
    const e = checkAutoPlanEligibility({ age: 30, needs_professional_review: true });
    expect(e.ok).toBe(false);
    if (!e.ok) expect(e.code).toBe("needs_review");
  });

  it("adult without review flag → allowed", () => {
    expect(checkAutoPlanEligibility({ age: 18, needs_professional_review: false }).ok).toBe(true);
  });
});
