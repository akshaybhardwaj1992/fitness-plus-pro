"use client";
import { useActionState } from "react";
import Link from "next/link";
import { saveMember } from "./actions";
import type { FormState } from "@/lib/form";
import { ACTIVITY_LEVELS, DIET_TYPES, EXPERIENCES, GOALS, type Member } from "@/lib/types";
import { ACTIVITY_LABELS, DIET_LABELS, EXPERIENCE_LABELS, GOAL_LABELS } from "@/lib/labels";
import { Field, Notice, buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { useRedirectOnSave } from "@/components/useRedirectOnSave";

const TEXT_FIELDS = [
  "full_name", "phone", "age", "sex", "height_cm", "weight_kg", "goal", "activity_level", "workouts_per_week",
  "experience", "diet_type", "allergies", "foods_to_avoid", "daily_budget_inr", "medical_notes",
] as const;
type TextField = (typeof TEXT_FIELDS)[number];

/** Form starting values: what was typed (after an error), else the saved member, else blanks. */
function defaults(typed: Record<string, string> | undefined, member: Member | undefined) {
  const text = {} as Record<TextField, string>;
  for (const k of TEXT_FIELDS) {
    const saved = member?.[k];
    text[k] = typed ? (typed[k] ?? "") : saved == null ? "" : String(saved);
  }
  const review = typed ? typed.needs_professional_review === "on" : Boolean(member?.needs_professional_review);
  return { text, review };
}

export function MemberForm({ member }: { member?: Member }) {
  const [state, action] = useActionState<FormState, FormData>(saveMember, { errors: {}, message: null });
  useRedirectOnSave(state);
  const e = state.errors;
  const { text: d, review } = defaults(state.values, member);

  return (
    // key: remount after each failed save so every field shows the typed value
    <form key={JSON.stringify(state.values ?? {})} action={action} className="space-y-6">
      {member && <input type="hidden" name="id" value={member.id} />}
      {state.message && <Notice tone="error">{state.message}</Notice>}

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 sm:p-6">
        <legend className="px-2 text-lg font-semibold">Basic details</legend>
        <Field label="Full name *" name="full_name" error={e.full_name}>
          <input id="full_name" name="full_name" required maxLength={120} defaultValue={d.full_name} className="input" />
        </Field>
        <Field label="Phone" name="phone" error={e.phone} hint="For WhatsApp sharing">
          <input id="phone" name="phone" type="tel" inputMode="tel" maxLength={20} defaultValue={d.phone} className="input" />
        </Field>
        <Field label="Age (years) *" name="age" error={e.age}>
          <input id="age" name="age" type="number" inputMode="numeric" min={10} max={100} step={1} required defaultValue={d.age} className="input" />
        </Field>
        <Field label="Sex *" name="sex" error={e.sex}>
          <select id="sex" name="sex" required defaultValue={d.sex} className="input">
            <option value="" disabled>Choose…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Height (cm) *" name="height_cm" error={e.height_cm}>
          <input id="height_cm" name="height_cm" type="number" inputMode="decimal" min={100} max={250} step={0.1} required defaultValue={d.height_cm} className="input" />
        </Field>
        <Field label="Weight (kg) *" name="weight_kg" error={e.weight_kg}>
          <input id="weight_kg" name="weight_kg" type="number" inputMode="decimal" min={25} max={300} step={0.1} required defaultValue={d.weight_kg} className="input" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 sm:p-6">
        <legend className="px-2 text-lg font-semibold">Training</legend>
        <Field label="Goal *" name="goal" error={e.goal}>
          <select id="goal" name="goal" required defaultValue={d.goal} className="input">
            <option value="" disabled>Choose…</option>
            {GOALS.map((g) => <option key={g} value={g}>{GOAL_LABELS[g]}</option>)}
          </select>
        </Field>
        <Field label="Activity level *" name="activity_level" error={e.activity_level}>
          <select id="activity_level" name="activity_level" required defaultValue={d.activity_level} className="input">
            <option value="" disabled>Choose…</option>
            {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{ACTIVITY_LABELS[a]}</option>)}
          </select>
        </Field>
        <Field label="Workouts per week *" name="workouts_per_week" error={e.workouts_per_week}>
          <input id="workouts_per_week" name="workouts_per_week" type="number" inputMode="numeric" min={0} max={7} step={1} required defaultValue={d.workouts_per_week || (member ? "0" : "3")} className="input" />
        </Field>
        <Field label="Experience *" name="experience" error={e.experience}>
          <select id="experience" name="experience" required defaultValue={d.experience || "beginner"} className="input">
            {EXPERIENCES.map((x) => <option key={x} value={x}>{EXPERIENCE_LABELS[x]}</option>)}
          </select>
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 sm:p-6">
        <legend className="px-2 text-lg font-semibold">Food</legend>
        <Field label="Diet type *" name="diet_type" error={e.diet_type}>
          <select id="diet_type" name="diet_type" required defaultValue={d.diet_type} className="input">
            <option value="" disabled>Choose…</option>
            {DIET_TYPES.map((x) => <option key={x} value={x}>{DIET_LABELS[x]}</option>)}
          </select>
        </Field>
        <Field label="Daily food budget (₹)" name="daily_budget_inr" error={e.daily_budget_inr} hint="Leave empty if no limit">
          <input id="daily_budget_inr" name="daily_budget_inr" type="number" inputMode="numeric" min={0} step={1} defaultValue={d.daily_budget_inr} className="input" />
        </Field>
        <Field label="Allergies" name="allergies" error={e.allergies} hint="Separate with commas, e.g. peanuts, milk">
          <textarea id="allergies" name="allergies" maxLength={500} defaultValue={d.allergies} className="input" />
        </Field>
        <Field label="Foods to avoid" name="foods_to_avoid" error={e.foods_to_avoid} hint="e.g. rice, mushroom">
          <textarea id="foods_to_avoid" name="foods_to_avoid" maxLength={500} defaultValue={d.foods_to_avoid} className="input" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-4 sm:p-6">
        <legend className="px-2 text-lg font-semibold">Health</legend>
        <Field label="Medical conditions or limitations" name="medical_notes" error={e.medical_notes} hint="e.g. knee pain, diabetes, BP, pregnancy">
          <textarea id="medical_notes" name="medical_notes" maxLength={2000} defaultValue={d.medical_notes} className="input" />
        </Field>
        <label className="flex items-start gap-3 rounded-xl border border-warn/50 bg-warn/10 p-3">
          <input type="checkbox" name="needs_professional_review" defaultChecked={review} className="mt-1" />
          <span>
            <b>Needs professional review</b>
            <span className="block text-sm text-muted">
              Tick if a doctor or dietitian should check before any diet. Automatic diet plans will be blocked.
            </span>
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <SubmitButton>{member ? "Save changes" : "Add member"}</SubmitButton>
        <Link href={member ? `/members/${member.id}` : "/members"} className={buttonClass("secondary")}>Cancel</Link>
      </div>
    </form>
  );
}
