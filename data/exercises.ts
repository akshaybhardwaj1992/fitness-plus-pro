// =====================================================================
// SEED DATA — starter exercise list. Instructions are original, short,
// plain-language cues written for this app (no copied text or images).
// Staff can edit everything in the Exercise list.
// =====================================================================
import type { Experience, Muscle } from "../src/lib/types";

export interface SeedExercise {
  name: string;
  target_muscle: Muscle;
  equipment: string;
  difficulty: Experience;
  default_sets: number;
  default_reps: string;
  default_rest_sec: number;
  instructions: string;
}

function e(
  name: string, target_muscle: Muscle, equipment: string, difficulty: Experience,
  default_sets: number, default_reps: string, default_rest_sec: number, instructions: string,
): SeedExercise {
  return { name, target_muscle, equipment, difficulty, default_sets, default_reps, default_rest_sec, instructions };
}

export const SEED_EXERCISES: SeedExercise[] = [
  // ---------------- chest
  e("Push-up", "chest", "none", "beginner", 3, "8-12", 60, "Hands a little wider than shoulders. Keep body in one straight line, lower chest near the floor, push back up."),
  e("Knee push-up", "chest", "none", "beginner", 3, "10-15", 60, "Same as a push-up but with knees on the floor. Keep hips in line with shoulders."),
  e("Dumbbell bench press", "chest", "dumbbells, flat bench", "beginner", 3, "8-12", 75, "Lie on the bench, dumbbells over chest. Lower slowly to chest level, then press up without locking elbows hard."),
  e("Barbell bench press", "chest", "barbell, flat bench", "intermediate", 4, "6-10", 90, "Feet flat, shoulder blades squeezed. Lower bar to mid-chest with control, press up. Use a spotter for heavy sets."),
  e("Incline dumbbell press", "chest", "dumbbells, incline bench", "intermediate", 3, "8-12", 75, "Bench at a low incline. Press dumbbells up over upper chest, lower slowly to the sides of the chest."),
  e("Dumbbell fly", "chest", "dumbbells, flat bench", "intermediate", 3, "10-12", 60, "Arms slightly bent, open them wide in an arc until you feel a chest stretch, then bring them back together."),
  e("Machine chest press", "chest", "chest press machine", "beginner", 3, "10-12", 60, "Set the seat so handles are at chest height. Push forward, return slowly without letting the weight stack touch."),
  e("Cable crossover", "chest", "cable machine", "intermediate", 3, "12-15", 60, "Step forward between the cables, slight lean. Bring handles together in front of the chest, return with control."),

  // ---------------- back
  e("Lat pulldown", "back", "lat pulldown machine", "beginner", 3, "10-12", 75, "Grip wider than shoulders. Pull the bar to upper chest by driving elbows down, return slowly to full stretch."),
  e("Seated cable row", "back", "cable row machine", "beginner", 3, "10-12", 75, "Sit tall, knees soft. Pull handle to your stomach, squeeze shoulder blades, return without rounding the back."),
  e("One-arm dumbbell row", "back", "dumbbell, flat bench", "beginner", 3, "10-12 each side", 60, "One hand and knee on the bench, back flat. Pull dumbbell toward your hip, lower slowly."),
  e("Barbell bent-over row", "back", "barbell", "intermediate", 4, "8-10", 90, "Hinge at hips, back flat, bar below knees. Pull bar to lower ribs, lower with control."),
  e("Assisted pull-up", "back", "assisted pull-up machine", "beginner", 3, "8-10", 75, "Kneel on the pad, grip the bar. Pull chin over the bar, lower slowly. More assistance = easier."),
  e("Pull-up", "back", "pull-up bar", "advanced", 3, "5-8", 90, "Hang with straight arms. Pull chest toward the bar, lower all the way down with control."),
  e("Deadlift", "back", "barbell", "advanced", 4, "5-6", 120, "Bar over mid-foot, back flat, chest up. Push the floor away and stand tall; lower the bar close to the legs. Learn with a coach first."),
  e("Back extension", "back", "hyperextension bench", "beginner", 3, "12-15", 60, "Hips on the pad, body straight. Lower the upper body slowly, rise until body is in line again. Do not over-arch."),

  // ---------------- shoulders
  e("Dumbbell shoulder press", "shoulders", "dumbbells, bench with back support", "beginner", 3, "8-12", 75, "Sit tall, dumbbells at shoulder height. Press overhead, lower back to shoulder level."),
  e("Machine shoulder press", "shoulders", "shoulder press machine", "beginner", 3, "10-12", 60, "Set seat so handles start at shoulder height. Press up, return slowly."),
  e("Barbell overhead press", "shoulders", "barbell", "intermediate", 4, "6-8", 90, "Stand tall, tighten stomach and glutes. Press bar from upper chest to overhead, head moves slightly back to clear the bar."),
  e("Lateral raise", "shoulders", "dumbbells", "beginner", 3, "12-15", 45, "Light dumbbells at your sides. Raise arms out to shoulder height with a slight elbow bend, lower slowly."),
  e("Front raise", "shoulders", "dumbbells", "beginner", 3, "10-12", 45, "Raise dumbbells in front of you to shoulder height, lower with control. No swinging."),
  e("Rear delt fly", "shoulders", "dumbbells", "beginner", 3, "12-15", 45, "Hinge forward, back flat. Raise dumbbells out to the sides, squeezing the back of the shoulders."),
  e("Face pull", "shoulders", "cable machine, rope", "intermediate", 3, "12-15", 45, "Rope at face height. Pull toward your forehead, elbows high and wide, then return slowly."),

  // ---------------- biceps
  e("Dumbbell curl", "biceps", "dumbbells", "beginner", 3, "10-12", 45, "Elbows close to the body. Curl dumbbells up, lower slowly. Do not swing the back."),
  e("Hammer curl", "biceps", "dumbbells", "beginner", 3, "10-12", 45, "Palms facing each other. Curl up keeping elbows still, lower slowly."),
  e("Barbell curl", "biceps", "barbell or EZ bar", "intermediate", 3, "8-10", 60, "Shoulder-width grip. Curl the bar to chest height, lower with control. Keep the body still."),
  e("Cable curl", "biceps", "cable machine", "beginner", 3, "12-15", 45, "Stand facing the cable, low pulley. Curl handle up, squeeze, lower slowly."),
  e("Concentration curl", "biceps", "dumbbell, bench", "intermediate", 3, "10-12 each side", 45, "Sit, elbow resting on inner thigh. Curl dumbbell up toward shoulder, lower slowly."),

  // ---------------- triceps
  e("Cable triceps pushdown", "triceps", "cable machine", "beginner", 3, "12-15", 45, "Elbows tucked at your sides. Push the handle down until arms are straight, return slowly to chest height."),
  e("Overhead dumbbell extension", "triceps", "dumbbell", "beginner", 3, "10-12", 45, "Hold one dumbbell overhead with both hands. Lower it behind the head by bending elbows, then straighten arms."),
  e("Bench dip", "triceps", "flat bench", "beginner", 3, "8-12", 60, "Hands on the bench behind you, legs forward. Bend elbows to lower hips, push back up. Stop if shoulders hurt."),
  e("Skull crusher", "triceps", "EZ bar, flat bench", "intermediate", 3, "8-10", 60, "Lying on the bench, bar over chest. Bend only at the elbows to lower bar toward forehead, then extend."),
  e("Close-grip bench press", "triceps", "barbell, flat bench", "intermediate", 3, "8-10", 75, "Hands shoulder-width on the bar. Lower to lower chest with elbows close, press up."),

  // ---------------- legs
  e("Bodyweight squat", "legs", "none", "beginner", 3, "12-15", 60, "Feet shoulder-width. Sit hips back and down, knees follow toes, stand up through the whole foot."),
  e("Goblet squat", "legs", "dumbbell or kettlebell", "beginner", 3, "10-12", 75, "Hold a weight at your chest. Squat down keeping chest up, stand back up."),
  e("Barbell back squat", "legs", "barbell, squat rack", "intermediate", 4, "6-10", 120, "Bar on upper back. Brace, squat to a depth you can control with a flat back, drive back up. Use safety bars."),
  e("Leg press", "legs", "leg press machine", "beginner", 3, "10-12", 90, "Feet hip-width on the platform. Lower until knees are near 90°, press back without locking knees hard."),
  e("Walking lunge", "legs", "none or dumbbells", "intermediate", 3, "10 each leg", 75, "Step forward, lower back knee toward the floor, push off and step through to the next lunge."),
  e("Romanian deadlift", "legs", "dumbbells or barbell", "intermediate", 3, "8-10", 90, "Soft knees, hinge at hips pushing them back, weights slide down the legs until hamstrings stretch, then stand."),
  e("Leg extension", "legs", "leg extension machine", "beginner", 3, "12-15", 60, "Pad on lower shins. Straighten the legs, pause, lower slowly."),
  e("Lying leg curl", "legs", "leg curl machine", "beginner", 3, "12-15", 60, "Lie face down, pad above heels. Curl heels toward glutes, lower slowly."),
  e("Standing calf raise", "legs", "calf machine or step", "beginner", 3, "15-20", 45, "Rise up onto toes as high as you can, pause, lower heels slowly below the step."),
  e("Glute bridge", "legs", "none", "beginner", 3, "12-15", 45, "Lie on your back, knees bent. Push through heels to lift hips until body is straight from knees to shoulders."),

  // ---------------- abs
  e("Plank", "abs", "none", "beginner", 3, "30-45 sec", 45, "Forearms on the floor, body in a straight line. Tighten stomach and glutes, breathe normally."),
  e("Side plank", "abs", "none", "beginner", 3, "20-30 sec each side", 45, "Lie on your side on one forearm, lift hips so the body forms a straight line. Hold."),
  e("Crunch", "abs", "none", "beginner", 3, "15-20", 45, "Lie on your back, knees bent. Curl shoulders off the floor using the stomach, lower slowly. Do not pull the neck."),
  e("Dead bug", "abs", "none", "beginner", 3, "8-10 each side", 45, "On your back, arms up, knees bent at 90°. Slowly lower opposite arm and leg, keeping the lower back on the floor."),
  e("Lying leg raise", "abs", "none", "intermediate", 3, "10-12", 45, "Lie flat, hands under hips. Raise straight legs to vertical, lower slowly without arching the back."),
  e("Bicycle crunch", "abs", "none", "intermediate", 3, "20 total", 45, "On your back, bring opposite elbow toward opposite knee while extending the other leg, alternate with control."),

  // ---------------- cardio
  e("Treadmill brisk walk", "cardio", "treadmill", "beginner", 1, "20 min", 0, "Walk at a pace where you can talk but not sing. A small incline makes it harder."),
  e("Stationary cycling", "cardio", "exercise bike", "beginner", 1, "15-20 min", 0, "Adjust seat so the knee is slightly bent at the bottom. Keep a steady, comfortable pace."),
  e("Elliptical trainer", "cardio", "elliptical machine", "beginner", 1, "15-20 min", 0, "Stand tall, use arms and legs together at a steady pace."),
  e("Rowing machine", "cardio", "rowing machine", "intermediate", 1, "10-15 min", 0, "Push with legs first, then lean back slightly and pull handle to lower ribs. Return in reverse order."),
  e("Jump rope", "cardio", "skipping rope", "intermediate", 5, "1 min", 45, "Small jumps on the balls of the feet, turn the rope with the wrists. Rest between rounds."),
  e("Mountain climber", "cardio", "none", "intermediate", 3, "30 sec", 45, "From a push-up position, drive knees toward the chest one at a time at a quick, controlled pace."),
];
