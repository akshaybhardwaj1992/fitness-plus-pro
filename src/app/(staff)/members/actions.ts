"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { parseMemberForm, parseWeightForm } from "@/lib/validation";
import { typedValues, type FormState } from "@/lib/form";

export async function saveMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireStaff();
  const values = typedValues(formData);
  const parsed = parseMemberForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, message: "Please fix the highlighted fields.", values };

  const id = String(formData.get("id") ?? "");
  let memberId = id;
  if (id) {
    const { error } = await supabase.from("members").update(parsed.data).eq("id", id);
    if (error) return { errors: {}, message: `Could not save: ${error.message}`, values };
  } else {
    const { data, error } = await supabase.from("members").insert(parsed.data).select("id").single();
    if (error) return { errors: {}, message: `Could not save: ${error.message}`, values };
    memberId = data.id;
    // First weight entry so the history starts on day one.
    await supabase.from("weight_logs").insert({
      member_id: memberId,
      weight_kg: parsed.data.weight_kg,
      logged_on: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
    });
  }
  // The form navigates itself (see FormState): a server redirect from the member forms stalled
  // in production builds. No revalidatePath needed — every page is rendered fresh per request.
  return { errors: {}, message: null, values, redirectTo: `/members/${memberId}` };
}

export async function setMemberActive(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  const { error } = await supabase.from("members").update({ is_active: active }).eq("id", id);
  if (error) return { errors: {}, message: `Could not update member: ${error.message}` };
  return { errors: {}, message: null, redirectTo: `/members/${id}` };
}

export async function addWeight(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireStaff();
  const memberId = String(formData.get("member_id") ?? "");
  const parsed = parseWeightForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, message: null };

  const { error } = await supabase
    .from("weight_logs")
    .upsert({ member_id: memberId, ...parsed.data }, { onConflict: "member_id,logged_on" });
  if (error) return { errors: {}, message: `Could not save weight: ${error.message}` };

  // Keep the profile weight equal to the newest entry.
  const { data: latest } = await supabase
    .from("weight_logs")
    .select("weight_kg")
    .eq("member_id", memberId)
    .order("logged_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest) await supabase.from("members").update({ weight_kg: latest.weight_kg }).eq("id", memberId);

  revalidatePath(`/members/${memberId}`);
  return { errors: {}, message: "Weight saved." };
}

export async function deleteWeight(formData: FormData): Promise<void> {
  const supabase = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) throw new Error(`Could not delete: ${error.message}`);
  revalidatePath(`/members/${memberId}`);
}
