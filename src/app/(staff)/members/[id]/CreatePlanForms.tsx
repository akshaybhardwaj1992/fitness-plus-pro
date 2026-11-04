"use client";
import { useActionState } from "react";
import { createDietPlan, createWorkoutPlan, type CreateState } from "../../plans/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Notice } from "@/components/ui";
import { WORKOUT_TEMPLATES } from "@/lib/workout/templates";

export function CreateDietForms({ memberId, autoBlockedReason }: { memberId: string; autoBlockedReason: string | null }) {
  const [state, action] = useActionState<CreateState, FormData>(createDietPlan, { reasons: [] });
  return (
    <div className="space-y-3">
      {autoBlockedReason && <Notice tone="warn" title="Automatic plan blocked">{autoBlockedReason}</Notice>}
      {state.reasons.length > 0 && (
        <Notice tone="error" title="No plan was made">
          <ul className="list-disc pl-5">
            {state.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </Notice>
      )}
      <form action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="member_id" value={memberId} />
        {!autoBlockedReason && (
          <SubmitButton name="mode" value="auto" pendingText="Building plan…">Make 7-day diet plan</SubmitButton>
        )}
        <SubmitButton name="mode" value="blank" variant="secondary" pendingText="Creating…">
          Start blank diet plan (by hand)
        </SubmitButton>
      </form>
    </div>
  );
}

export function CreateWorkoutForm({ memberId, suggested }: { memberId: string; suggested: string }) {
  const [state, action] = useActionState<CreateState, FormData>(createWorkoutPlan, { reasons: [] });
  return (
    <form action={action} className="space-y-3">
      {state.reasons.length > 0 && <Notice tone="error">{state.reasons.join(" ")}</Notice>}
      <input type="hidden" name="member_id" value={memberId} />
      <label htmlFor="template" className="block font-medium">Template</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select id="template" name="template" defaultValue={suggested} className="input sm:flex-1">
          {WORKOUT_TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}{t.key === suggested ? " (suggested)" : ""}
            </option>
          ))}
          <option value="blank">Blank — build by hand</option>
        </select>
        <SubmitButton pendingText="Creating…">Make workout plan</SubmitButton>
      </div>
    </form>
  );
}
