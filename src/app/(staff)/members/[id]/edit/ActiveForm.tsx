"use client";
import { useActionState } from "react";
import { setMemberActive } from "../../actions";
import type { FormState } from "@/lib/form";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Notice } from "@/components/ui";
import { useRedirectOnSave } from "@/components/useRedirectOnSave";

export function ActiveForm({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(setMemberActive, { errors: {}, message: null });
  useRedirectOnSave(state);
  return (
    <form action={action} className="space-y-3">
      {state.message && <Notice tone="error">{state.message}</Notice>}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={isActive ? "false" : "true"} />
      {isActive ? (
        <ConfirmButton question={`Deactivate ${name}?`} confirmText="Yes, deactivate">
          Deactivate member
        </ConfirmButton>
      ) : (
        <ConfirmButton question={`Reactivate ${name}?`} confirmText="Yes, reactivate" variant="secondary">
          Reactivate member
        </ConfirmButton>
      )}
    </form>
  );
}
