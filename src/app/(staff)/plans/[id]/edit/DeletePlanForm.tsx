"use client";
import { useActionState } from "react";
import { deletePlan } from "../../actions";
import type { FormState } from "@/lib/form";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Notice } from "@/components/ui";
import { useRedirectOnSave } from "@/components/useRedirectOnSave";

export function DeletePlanForm({ id }: { id: string }) {
  const [state, action] = useActionState<FormState, FormData>(deletePlan, { errors: {}, message: null });
  useRedirectOnSave(state);
  return (
    <form action={action} className="space-y-3">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <input type="hidden" name="id" value={id} />
      <ConfirmButton question="Delete this plan permanently?" confirmText="Yes, delete">Delete plan</ConfirmButton>
    </form>
  );
}
