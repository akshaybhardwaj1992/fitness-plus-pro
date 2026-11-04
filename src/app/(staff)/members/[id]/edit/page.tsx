import { notFound } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { toMember } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui";
import { MemberForm } from "../../MemberForm";
import { ActiveForm } from "./ActiveForm";

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (staff.status !== "staff") return null;
  const { id } = await params;
  const { data } = await staff.supabase.from("members").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const member = toMember(data);

  return (
    <>
      <PageHeader title={`Edit ${member.full_name}`} />
      <MemberForm member={member} />

      <Card className="mt-8">
        <h2 className="text-lg font-semibold">{member.is_active ? "Deactivate member" : "Reactivate member"}</h2>
        <p className="mb-3 mt-1 text-muted">
          {member.is_active
            ? "Use this when a member leaves. Their history and plans are kept, and you can reactivate them any time."
            : "This member is inactive. Reactivate to show them in the main list again."}
        </p>
        <ActiveForm id={member.id} name={member.full_name} isActive={member.is_active} />
      </Card>
    </>
  );
}
