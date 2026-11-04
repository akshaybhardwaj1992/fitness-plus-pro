import { NUTRITION_RULES as R } from "./config";
import type { MemberForPlan, Sex, Targets } from "@/lib/types";

export type Eligibility =
  | { ok: true }
  | { ok: false; code: "under_18" | "needs_review"; message: string };

/** Can the system auto-generate a diet plan for this member? */
export function checkAutoPlanEligibility(
  m: Pick<MemberForPlan, "age" | "needs_professional_review">,
): Eligibility {
  if (m.age < R.minAdultAge) {
    return {
      ok: false,
      code: "under_18",
      message: `Member is under ${R.minAdultAge}. Needs trainer manual plan — the calorie formula is only for adults.`,
    };
  }
  if (m.needs_professional_review) {
    return {
      ok: false,
      code: "needs_review",
      message:
        "This member is marked “needs professional review”. Automatic plans are blocked. A trainer can still build a plan by hand.",
    };
  }
  return { ok: true };
}

/** Mifflin-St Jeor basal metabolic rate (kcal/day). */
export function mifflinStJeorBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

const round = (n: number, step = 1) => Math.round(n / step) * step;

/**
 * Daily targets for an adult member. Throws for under-18s: callers must
 * check eligibility first (the formula is not valid for them).
 */
export function calculateTargets(m: MemberForPlan): Targets {
  if (m.age < R.minAdultAge) throw new Error("calculateTargets: member is under 18");

  const notes: string[] = [];
  const bmr = mifflinStJeorBmr(m.sex, m.weight_kg, m.height_cm, m.age);
  const tdee = bmr * R.activityMultipliers[m.activity_level];

  let adjustment: number = R.goalAdjustment[m.goal];
  if (adjustment < -R.maxDeficit) adjustment = -R.maxDeficit;
  const goalCalories = tdee * (1 + adjustment);

  const floor = R.calorieFloor[m.sex];
  const floorApplied = goalCalories < floor;
  const calories = round(Math.max(goalCalories, floor), 10);
  if (floorApplied) {
    notes.push(`Calories raised to the safety minimum of ${floor} kcal.`);
    if (floor > tdee) {
      notes.push("The safety minimum is above this member's estimated maintenance calories — trainer should review.");
    }
  }

  // Fat
  const fatRange: [number, number] = [
    round((calories * R.fatShareRange[0]) / R.kcalPerGram.fat),
    round((calories * R.fatShareRange[1]) / R.kcalPerGram.fat),
  ];
  const fat = round((calories * R.fatShareTarget) / R.kcalPerGram.fat);

  // Protein
  const [pMinPerKg, pMaxPerKg] = R.proteinGPerKg[m.goal];
  const proteinRange: [number, number] = [round(pMinPerKg * m.weight_kg), round(pMaxPerKg * m.weight_kg)];
  let protein = round(((pMinPerKg + pMaxPerKg) / 2) * m.weight_kg);

  // Carbs = remainder; keep a sensible minimum by lowering protein (never below its min)
  const carbsFor = (p: number) => (calories - p * R.kcalPerGram.protein - fat * R.kcalPerGram.fat) / R.kcalPerGram.carbs;
  if (carbsFor(protein) < R.minCarbsG) {
    const maxProtein = Math.floor((calories - fat * R.kcalPerGram.fat - R.minCarbsG * R.kcalPerGram.carbs) / R.kcalPerGram.protein);
    const lowered = Math.max(proteinRange[0], maxProtein);
    if (lowered < protein) {
      protein = lowered;
      notes.push("Protein set toward the lower end so the plan still has enough carbohydrate.");
    }
  }
  const carbs = Math.max(0, round(carbsFor(protein)));

  return {
    bmr: round(bmr),
    tdee: round(tdee),
    calories,
    calorie_floor: floor,
    floor_applied: floorApplied,
    protein_g: protein,
    protein_range_g: proteinRange,
    fat_g: fat,
    fat_range_g: fatRange,
    carbs_g: carbs,
    notes,
  };
}
