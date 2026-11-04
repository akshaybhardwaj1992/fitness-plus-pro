import type { FieldErrors } from "@/lib/validation";

/**
 * Result of a form server action. `values` = what was typed, so the form can refill after an error.
 * `redirectTo` = page to open after a successful save (the form navigates there itself; a server-side
 * redirect() from these forms stalled in production builds). Keep `values` on success too: the forms
 * are keyed on them, and remounting a form right after its action finished also stalled navigation.
 */
export type FormState = {
  errors: FieldErrors;
  message: string | null;
  values?: Record<string, string>;
  redirectTo?: string;
};

/** Text values from a form submission (multi-value fields joined with "|"). */
export function typedValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v !== "string" || k.startsWith("$")) continue;
    out[k] = k in out ? `${out[k]}|${v}` : v;
  }
  return out;
}
