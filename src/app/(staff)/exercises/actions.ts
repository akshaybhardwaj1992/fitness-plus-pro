"use server";
import { requireStaff } from "@/lib/auth";
import { typedValues, type FormState } from "@/lib/form";
import { parseExerciseForm } from "@/lib/validation";

export async function saveExercise(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireStaff();
  const values = typedValues(formData);
  const parsed = parseExerciseForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, message: "Please fix the highlighted fields.", values };

  const id = String(formData.get("id") ?? "");
  const { error } = id
    ? await supabase.from("exercises").update(parsed.data).eq("id", id)
    : await supabase.from("exercises").insert(parsed.data);
  if (error) {
    const message = error.code === "23505" ? "An exercise with this name already exists." : `Could not save: ${error.message}`;
    return { errors: error.code === "23505" ? { name: message } : {}, message, values };
  }
  return { errors: {}, message: null, values, redirectTo: "/exercises" };
}
