import { notFound } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { asDietContent, asWorkoutContent, toExercise, toFood, toMember, toPlan } from "@/lib/data";
import { Card, Notice } from "@/components/ui";
import { DeletePlanForm } from "./DeletePlanForm";
import { DietEditor } from "./DietEditor";
import { WorkoutEditor } from "./WorkoutEditor";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (staff.status !== "staff") return null;
  const { id } = await params;
  const sb = staff.supabase;

  const { data: row, error } = await sb.from("plans").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) notFound();
  const plan = toPlan(row);

  const { data: memberRow } = await sb.from("members").select("*").eq("id", plan.member_id).single();
  if (!memberRow) notFound();
  const member = toMember(memberRow);

  let editor: React.ReactNode;
  if (plan.type === "diet") {
    const content = asDietContent(plan.content);
    const { data: foods, error: fe } = await sb.from("foods").select("*").order("name");
    if (fe) throw new Error(fe.message);
    editor = content ? (
      <DietEditor
        planId={plan.id}
        memberId={member.id}
        memberName={member.full_name}
        member={member}
        foods={(foods ?? []).map(toFood)}
        initial={{ title: plan.title, status: plan.status, content }}
      />
    ) : null;
  } else {
    const content = asWorkoutContent(plan.content);
    const { data: ex, error: ee } = await sb.from("exercises").select("*").order("name");
    if (ee) throw new Error(ee.message);
    editor = content ? (
      <WorkoutEditor
        planId={plan.id}
        memberId={member.id}
        memberName={member.full_name}
        exercises={(ex ?? []).map(toExercise)}
        initial={{ title: plan.title, status: plan.status, content }}
      />
    ) : null;
  }

  return (
    <>
      {editor ?? <Notice tone="error" title="This plan could not be opened">The saved data is not in a format this app understands.</Notice>}

      <Card className="mt-10">
        <h2 className="text-lg font-semibold">Delete this plan</h2>
        <p className="mb-3 mt-1 text-muted">This removes the plan for good. It cannot be undone.</p>
        <DeletePlanForm id={plan.id} />
      </Card>
    </>
  );
}
