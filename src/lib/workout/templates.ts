// Workout templates. They refer to exercises by name; when a plan is created
// the names are matched to the Exercise list (case-insensitive). Staff can edit
// every exercise, set and rep in the plan afterwards.
import type { Exercise, Experience, Goal, WorkoutDay, WorkoutPlanContent } from "@/lib/types";

export interface WorkoutTemplate {
  key: string;
  label: string;
  description: string;
  days: { name: string; exercises: string[] }[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    key: "beginner_full_body_3",
    label: "Beginner — 3-day full body",
    description: "Whole body each session, 3 days a week (e.g. Mon/Wed/Fri). Good for new members.",
    days: [
      { name: "Day 1 — Full body A", exercises: ["Goblet squat", "Dumbbell bench press", "Lat pulldown", "Dumbbell shoulder press", "Plank", "Treadmill brisk walk"] },
      { name: "Day 2 — Full body B", exercises: ["Leg press", "Knee push-up", "Seated cable row", "Lateral raise", "Glute bridge", "Dead bug"] },
      { name: "Day 3 — Full body C", exercises: ["Bodyweight squat", "Machine chest press", "One-arm dumbbell row", "Dumbbell curl", "Cable triceps pushdown", "Crunch", "Stationary cycling"] },
    ],
  },
  {
    key: "upper_lower_4",
    label: "4-day upper / lower",
    description: "Upper body and lower body on alternate days, 4 days a week.",
    days: [
      { name: "Day 1 — Upper A", exercises: ["Dumbbell bench press", "Lat pulldown", "Dumbbell shoulder press", "Seated cable row", "Dumbbell curl", "Cable triceps pushdown"] },
      { name: "Day 2 — Lower A", exercises: ["Goblet squat", "Romanian deadlift", "Leg extension", "Lying leg curl", "Standing calf raise", "Plank"] },
      { name: "Day 3 — Upper B", exercises: ["Incline dumbbell press", "One-arm dumbbell row", "Lateral raise", "Face pull", "Hammer curl", "Overhead dumbbell extension"] },
      { name: "Day 4 — Lower B", exercises: ["Leg press", "Walking lunge", "Glute bridge", "Lying leg curl", "Standing calf raise", "Dead bug"] },
    ],
  },
  {
    key: "split_5",
    label: "5-day split",
    description: "One main muscle group per day, 5 days a week. For members with some experience.",
    days: [
      { name: "Day 1 — Chest", exercises: ["Barbell bench press", "Incline dumbbell press", "Dumbbell fly", "Cable crossover", "Push-up"] },
      { name: "Day 2 — Back", exercises: ["Lat pulldown", "Barbell bent-over row", "Seated cable row", "One-arm dumbbell row", "Back extension"] },
      { name: "Day 3 — Legs", exercises: ["Barbell back squat", "Leg press", "Romanian deadlift", "Leg extension", "Lying leg curl", "Standing calf raise"] },
      { name: "Day 4 — Shoulders & abs", exercises: ["Barbell overhead press", "Lateral raise", "Rear delt fly", "Face pull", "Plank", "Bicycle crunch"] },
      { name: "Day 5 — Arms", exercises: ["Barbell curl", "Hammer curl", "Concentration curl", "Close-grip bench press", "Skull crusher", "Cable triceps pushdown"] },
    ],
  },
  {
    key: "general_fitness",
    label: "General fitness",
    description: "Light strength plus cardio, 3 days a week. For health, stamina and feeling good.",
    days: [
      { name: "Day 1 — Strength + cardio", exercises: ["Bodyweight squat", "Knee push-up", "Lat pulldown", "Glute bridge", "Plank", "Treadmill brisk walk"] },
      { name: "Day 2 — Cardio + core", exercises: ["Stationary cycling", "Elliptical trainer", "Dead bug", "Side plank", "Crunch"] },
      { name: "Day 3 — Strength + cardio", exercises: ["Goblet squat", "Machine chest press", "Seated cable row", "Machine shoulder press", "Back extension", "Treadmill brisk walk"] },
    ],
  },
];

export function getTemplate(key: string): WorkoutTemplate | undefined {
  return WORKOUT_TEMPLATES.find((t) => t.key === key);
}

/** A sensible starting template for this member. Staff can pick any other. */
export function suggestTemplate(m: { goal: Goal; experience: Experience; workouts_per_week: number }): string {
  if (m.goal === "general_fitness") return "general_fitness";
  if (m.workouts_per_week >= 5 && m.experience !== "beginner") return "split_5";
  if (m.workouts_per_week >= 4) return "upper_lower_4";
  return "beginner_full_body_3";
}

/** Turn a template into plan content using the gym's exercise list. */
export function buildWorkoutFromTemplate(
  template: WorkoutTemplate,
  exercises: Exercise[],
): { content: WorkoutPlanContent; missing: string[] } {
  const byName = new Map(exercises.filter((x) => x.is_active).map((x) => [x.name.toLowerCase(), x]));
  const missing: string[] = [];
  const days: WorkoutDay[] = template.days.map((d) => ({
    name: d.name,
    exercises: d.exercises.flatMap((name) => {
      const ex = byName.get(name.toLowerCase());
      if (!ex) {
        missing.push(name);
        return [];
      }
      return [{
        exercise_id: ex.id,
        name: ex.name,
        target_muscle: ex.target_muscle,
        sets: ex.default_sets,
        reps: ex.default_reps,
        rest_sec: ex.default_rest_sec,
        notes: "",
      }];
    }),
  }));
  const notes = missing.length > 0 ? `Not in exercise list (skipped): ${missing.join(", ")}.` : "";
  return { content: { kind: "workout", version: 1, template: template.key, days, notes }, missing };
}
