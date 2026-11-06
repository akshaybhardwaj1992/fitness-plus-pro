"use server";
import { requireStaff } from "@/lib/auth";
import { typedValues, type FormState } from "@/lib/form";
import { parseFoodForm } from "@/lib/validation";

export async function saveFood(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireStaff();
  const values = typedValues(formData);
  const parsed = parseFoodForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, message: "Please fix the highlighted fields.", values };

  const id = String(formData.get("id") ?? "");
  const { error } = id
    ? await supabase.from("foods").update(parsed.data).eq("id", id)
    : await supabase.from("foods").insert(parsed.data);
  if (error) {
    const message = error.code === "23505" ? "A food with this name already exists." : `Could not save: ${error.message}`;
    return { errors: error.code === "23505" ? { name: message } : {}, message, values };
  }
  return { errors: {}, message: null, values, redirectTo: "/foods" };
}
