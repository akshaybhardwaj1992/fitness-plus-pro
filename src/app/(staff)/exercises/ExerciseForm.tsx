"use client";
import { useActionState } from "react";
import Link from "next/link";
import { saveExercise } from "./actions";
import type { FormState } from "@/lib/form";
import { EXPERIENCES, MUSCLES, type Exercise } from "@/lib/types";
import { EXPERIENCE_LABELS, MUSCLE_LABELS } from "@/lib/labels";
import { Field, Notice, buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { useRedirectOnSave } from "@/components/useRedirectOnSave";

const TEXT = ["name", "target_muscle", "equipment", "difficulty", "default_sets", "default_reps", "default_rest_sec", "instructions"] as const;

export function ExerciseForm({ exercise }: { exercise?: Exercise }) {
  const [state, action] = useActionState<FormState, FormData>(saveExercise, { errors: {}, message: null });
  useRedirectOnSave(state);
  const e = state.errors;
  const t = state.values;
  const d = Object.fromEntries(
    TEXT.map((k) => [k, t ? (t[k] ?? "") : exercise?.[k] == null ? "" : String(exercise[k])]),
  ) as Record<(typeof TEXT)[number], string>;
  const active = t ? t.is_active === "on" : (exercise?.is_active ?? true);

  return (
    <form key={JSON.stringify(t ?? {})} action={action} className="space-y-6">
      {exercise && <input type="hidden" name="id" value={exercise.id} />}
      {state.message && <Notice tone="error">{state.message}</Notice>}

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 sm:p-6">
        <legend className="px-2 text-lg font-semibold">Exercise</legend>
        <Field label="Name *" name="name" error={e.name}>
          <input id="name" name="name" required maxLength={120} defaultValue={d.name} className="input" />
        </Field>
        <Field label="Target muscle *" name="target_muscle" error={e.target_muscle}>
          <select id="target_muscle" name="target_muscle" required defaultValue={d.target_muscle} className="input">
            <option value="" disabled>Choose…</option>
            {MUSCLES.map((m) => <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>)}
          </select>
        </Field>
        <Field label="Equipment" name="equipment" error={e.equipment} hint="e.g. dumbbells, machine, none">
          <input id="equipment" name="equipment" maxLength={80} defaultValue={d.equipment} className="input" />
        </Field>
        <Field label="Difficulty *" name="difficulty" error={e.difficulty}>
          <select id="difficulty" name="difficulty" required defaultValue={d.difficulty || "beginner"} className="input">
            {EXPERIENCES.map((x) => <option key={x} value={x}>{EXPERIENCE_LABELS[x]}</option>)}
          </select>
        </Field>
        <Field label="Default sets *" name="default_sets" error={e.default_sets}>
          <input id="default_sets" name="default_sets" type="number" inputMode="numeric" min={1} max={10} required defaultValue={d.default_sets || "3"} className="input" />
        </Field>
        <Field label="Default reps or time *" name="default_reps" error={e.default_reps} hint="e.g. 10-12, 30 sec, 20 min">
          <input id="default_reps" name="default_reps" required maxLength={30} defaultValue={d.default_reps || "10-12"} className="input" />
        </Field>
        <Field label="Rest between sets (seconds) *" name="default_rest_sec" error={e.default_rest_sec}>
          <input id="default_rest_sec" name="default_rest_sec" type="number" inputMode="numeric" min={0} max={600} step={15} required defaultValue={d.default_rest_sec || "60"} className="input" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="How to do it" name="instructions" error={e.instructions} hint="Short, simple steps in your own words">
            <textarea id="instructions" name="instructions" maxLength={1000} defaultValue={d.instructions} className="input" />
          </Field>
        </div>
        <label className="flex items-start gap-3 rounded-xl bg-raised p-3 sm:col-span-2">
          <input type="checkbox" name="is_active" defaultChecked={active} className="mt-1" />
          <span><b>Active</b><span className="block text-sm text-muted">Untick to hide from new plans.</span></span>
        </label>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <SubmitButton>{exercise ? "Save changes" : "Add exercise"}</SubmitButton>
        <Link href="/exercises" className={buttonClass("secondary")}>Cancel</Link>
      </div>
    </form>
  );
}
