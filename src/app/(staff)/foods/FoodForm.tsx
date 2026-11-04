"use client";
import { useActionState } from "react";
import Link from "next/link";
import { saveFood } from "./actions";
import type { FormState } from "@/lib/form";
import { ALLERGEN_TAGS, DIET_TYPES, FOOD_CATEGORIES, FOOD_ROLES, type Food } from "@/lib/types";
import { ALLERGEN_LABELS, CATEGORY_LABELS, DIET_LABELS, ROLE_LABELS } from "@/lib/labels";
import { Field, Notice, buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { useRedirectOnSave } from "@/components/useRedirectOnSave";

const TEXT = [
  "name", "category", "diet_type", "serving_size_g", "serving_desc", "kcal", "protein_g", "carbs_g", "fat_g",
  "fibre_g", "price_inr", "source",
] as const;

export function FoodForm({ food }: { food?: Food }) {
  const [state, action] = useActionState<FormState, FormData>(saveFood, { errors: {}, message: null });
  useRedirectOnSave(state);
  const e = state.errors;
  const t = state.values;
  const d = Object.fromEntries(
    TEXT.map((k) => [k, t ? (t[k] ?? "") : food?.[k] == null ? "" : String(food[k])]),
  ) as Record<(typeof TEXT)[number], string>;
  const list = (k: "allergens" | "roles") => (t ? (t[k] ?? "").split("|") : (food?.[k] ?? []));
  const flag = (k: "verified" | "is_active", dflt: boolean) => (t ? t[k] === "on" : (food?.[k] ?? dflt));

  return (
    <form key={JSON.stringify(t ?? {})} action={action} className="space-y-6">
      {food && <input type="hidden" name="id" value={food.id} />}
      {state.message && <Notice tone="error">{state.message}</Notice>}

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 sm:p-6">
        <legend className="px-2 text-lg font-semibold">Food</legend>
        <Field label="Name *" name="name" error={e.name}>
          <input id="name" name="name" required maxLength={120} defaultValue={d.name} className="input" />
        </Field>
        <Field label="Category *" name="category" error={e.category}>
          <select id="category" name="category" required defaultValue={d.category} className="input">
            <option value="" disabled>Choose…</option>
            {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </Field>
        <Field label="Diet type *" name="diet_type" error={e.diet_type} hint="Vegan = no animal products. Vegetarian = may contain milk.">
          <select id="diet_type" name="diet_type" required defaultValue={d.diet_type} className="input">
            <option value="" disabled>Choose…</option>
            {DIET_TYPES.map((x) => <option key={x} value={x}>{DIET_LABELS[x]}</option>)}
          </select>
        </Field>
        <Field label="Price per serving (₹)" name="price_inr" error={e.price_inr} hint="Rough cost — used for budgets">
          <input id="price_inr" name="price_inr" type="number" inputMode="decimal" min={0} step={0.5} defaultValue={d.price_inr} className="input" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 sm:p-6">
        <legend className="px-2 text-lg font-semibold">Nutrition for ONE serving</legend>
        <Field label="Serving size (g) *" name="serving_size_g" error={e.serving_size_g}>
          <input id="serving_size_g" name="serving_size_g" type="number" inputMode="decimal" min={1} step={0.1} required defaultValue={d.serving_size_g} className="input" />
        </Field>
        <Field label="Serving in words" name="serving_desc" error={e.serving_desc} hint="e.g. 1 katori, 2 roti">
          <input id="serving_desc" name="serving_desc" maxLength={80} defaultValue={d.serving_desc} className="input" />
        </Field>
        <Field label="Calories (kcal) *" name="kcal" error={e.kcal}>
          <input id="kcal" name="kcal" type="number" inputMode="decimal" min={0} step={0.1} required defaultValue={d.kcal} className="input" />
        </Field>
        <Field label="Protein (g) *" name="protein_g" error={e.protein_g}>
          <input id="protein_g" name="protein_g" type="number" inputMode="decimal" min={0} step={0.1} required defaultValue={d.protein_g} className="input" />
        </Field>
        <Field label="Carbs (g) *" name="carbs_g" error={e.carbs_g}>
          <input id="carbs_g" name="carbs_g" type="number" inputMode="decimal" min={0} step={0.1} required defaultValue={d.carbs_g} className="input" />
        </Field>
        <Field label="Fat (g) *" name="fat_g" error={e.fat_g}>
          <input id="fat_g" name="fat_g" type="number" inputMode="decimal" min={0} step={0.1} required defaultValue={d.fat_g} className="input" />
        </Field>
        <Field label="Fibre (g)" name="fibre_g" error={e.fibre_g}>
          <input id="fibre_g" name="fibre_g" type="number" inputMode="decimal" min={0} step={0.1} defaultValue={d.fibre_g} className="input" />
        </Field>
        <Field label="Source *" name="source" error={e.source} hint="e.g. IFCT 2017, USDA FoodData Central, food label">
          <input id="source" name="source" required maxLength={200} defaultValue={d.source} className="input" />
        </Field>
        <label className="flex items-start gap-3 rounded-xl bg-raised p-3 sm:col-span-2">
          <input type="checkbox" name="verified" defaultChecked={flag("verified", false)} className="mt-1" />
          <span><b>Verified</b><span className="block text-sm text-muted">Tick only after checking these numbers against the source.</span></span>
        </label>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-card p-4 sm:p-6">
        <legend className="px-2 text-lg font-semibold">Contains (allergens)</legend>
        <p className="mb-3 text-muted">Tick everything this food contains. Members with these allergies will never get it.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {ALLERGEN_TAGS.map((a) => (
            <label key={a} className="flex min-h-12 items-center gap-3 rounded-xl bg-raised px-3">
              <input type="checkbox" name="allergens" value={a} defaultChecked={list("allergens").includes(a)} />
              {ALLERGEN_LABELS[a]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-card p-4 sm:p-6">
        <legend className="px-2 text-lg font-semibold">Can be used as *</legend>
        <p className="mb-3 text-muted">Where the automatic planner may put this food.</p>
        {e.roles && <p className="mb-2 text-danger">{e.roles}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {FOOD_ROLES.map((r) => (
            <label key={r} className="flex min-h-12 items-center gap-3 rounded-xl bg-raised px-3">
              <input type="checkbox" name="roles" value={r} defaultChecked={list("roles").includes(r)} />
              {ROLE_LABELS[r]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
        <input type="checkbox" name="is_active" defaultChecked={flag("is_active", true)} className="mt-1" />
        <span><b>Active</b><span className="block text-sm text-muted">Untick to hide this food from new plans (old plans keep it).</span></span>
      </label>

      <div className="flex flex-wrap gap-3">
        <SubmitButton>{food ? "Save changes" : "Add food"}</SubmitButton>
        <Link href="/foods" className={buttonClass("secondary")}>Cancel</Link>
      </div>
    </form>
  );
}
