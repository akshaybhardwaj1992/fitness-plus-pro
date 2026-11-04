"use client";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice } from "@/components/ui";

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(login, { error: null, email: "" });
  return (
    <form action={action} className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} className="input" />
      </Field>
      <Field label="Password" name="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </Field>
      <SubmitButton pendingText="Logging in…" className="w-full">Log in</SubmitButton>
    </form>
  );
}
