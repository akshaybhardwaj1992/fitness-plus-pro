"use client";
import { useActionState } from "react";
import { addWeight } from "../actions";
import type { FormState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice } from "@/components/ui";

export function WeightForm({ memberId, today }: { memberId: string; today: string }) {
  const [state, action] = useActionState<FormState, FormData>(addWeight, { errors: {}, message: null });
  const failed = Object.keys(state.errors).length > 0 || (state.message && state.message !== "Weight saved.");
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="member_id" value={memberId} />
      {state.message && <Notice tone={failed ? "error" : "ok"}>{state.message}</Notice>}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
        <Field label="Date" name="logged_on" error={state.errors.logged_on}>
          <input id="logged_on" name="logged_on" type="date" required defaultValue={today} max={today} className="input" />
        </Field>
        <Field label="Weight (kg)" name="w_kg" error={state.errors.weight_kg}>
          <input id="w_kg" name="weight_kg" type="number" inputMode="decimal" min={25} max={300} step={0.1} required className="input" />
        </Field>
        <Field label="Note (optional)" name="note" error={state.errors.note}>
          <input id="note" name="note" maxLength={200} className="input" />
        </Field>
        <SubmitButton pendingText="Saving…">Add weight</SubmitButton>
      </div>
      <p className="text-sm text-muted">Adding a weight for a date that already has one replaces it.</p>
    </form>
  );
}
