import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { asDietContent, toMember, toPlan, toWeightLog } from "@/lib/data";
import { calculateTargets, checkAutoPlanEligibility } from "@/lib/nutrition/calc";
import { checkDietPlan } from "@/lib/nutrition/rules";
import { suggestTemplate } from "@/lib/workout/templates";
import {
  ACTIVITY_LABELS, COOKING_LABELS, DIET_LABELS, EXPERIENCE_LABELS, GOAL_LABELS, SEX_LABELS, fmt, fmtDate,
} from "@/lib/labels";
import type { PlanRow } from "@/lib/types";
import { Badge, Card, EmptyState, LinkButton, Notice, PageHeader, Stat, buttonClass } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteWeight } from "../actions";
import { CreateDietForms, CreateWorkoutForm } from "./CreatePlanForms";
import { WeightForm } from "./WeightForm";

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getStaff();
  if (staff.status !== "staff") return null;
  const { id } = await params;
  const sb = staff.supabase;

  const [memberRes, plansRes, weightsRes] = await Promise.all([
    sb.from("members").select("*").eq("id", id).maybeSingle(),
    sb.from("plans").select("*").eq("member_id", id).order("updated_at", { ascending: false }),
    sb.from("weight_logs").select("*").eq("member_id", id).order("logged_on", { ascending: false }).limit(60),
  ]);
  if (memberRes.error) throw new Error(memberRes.error.message);
  if (!memberRes.data) notFound();

  const m = toMember(memberRes.data);
  const plans = (plansRes.data ?? []).map(toPlan);
  const weights = (weightsRes.data ?? []).map(toWeightLog);
  const eligibility = checkAutoPlanEligibility(m);
  const targets = eligibility.ok ? calculateTargets(m) : null;
  const dietPlans = plans.filter((p) => p.type === "diet");
  // If allergies / diet type changed after publishing, the current plan may now be unsafe.
  const currentDiet = dietPlans.find((p) => p.status === "published");
  const currentDietContent = currentDiet ? asDietContent(currentDiet.content) : null;
  const currentDietProblems = currentDietContent
    ? checkDietPlan(currentDietContent, m, { strict: false }).errors
    : [];
  const workoutPlans = plans.filter((p) => p.type === "workout");
  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD, India time

  const first = weights.at(-1);
  const latest = weights[0];
  const change = first && latest && weights.length > 1 ? latest.weight_kg - first.weight_kg : null;

  return (
    <>
      <PageHeader
        title={m.full_name}
        subtitle={
          <span className="flex flex-wrap gap-2">
            {!m.is_active && <Badge>Inactive</Badge>}
            <Badge tone="green">{DIET_LABELS[m.diet_type]}</Badge>
            {m.needs_professional_review && <Badge tone="warn">Needs professional review</Badge>}
            {m.age < 18 && <Badge tone="warn">Under 18</Badge>}
          </span>
        }
        actions={
          <>
            <LinkButton href={`/members/${m.id}/edit`} variant="secondary">Edit profile</LinkButton>
            <LinkButton href="/members" variant="ghost">← All members</LinkButton>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- profile */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Profile</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-muted">Phone</dt><dd>{m.phone || "—"}</dd>
            <dt className="text-muted">Age / sex</dt><dd>{m.age} yrs · {SEX_LABELS[m.sex]}</dd>
            <dt className="text-muted">Height / weight</dt><dd>{m.height_cm} cm · {m.weight_kg} kg</dd>
            <dt className="text-muted">Goal</dt><dd>{GOAL_LABELS[m.goal]}</dd>
            <dt className="text-muted">Activity</dt><dd>{ACTIVITY_LABELS[m.activity_level]}</dd>
            <dt className="text-muted">Workouts</dt><dd>{m.workouts_per_week} per week · {EXPERIENCE_LABELS[m.experience]}</dd>
            <dt className="text-muted">Cooking</dt><dd>{COOKING_LABELS[m.cooking_style]}</dd>
            <dt className="text-muted">Budget</dt><dd>{m.daily_budget_inr != null ? `₹${fmt(m.daily_budget_inr)} / day` : "No limit"}</dd>
            <dt className="text-muted">Allergies</dt><dd className={m.allergies ? "text-danger" : ""}>{m.allergies || "None"}</dd>
            <dt className="text-muted">Avoid</dt><dd>{m.foods_to_avoid || "—"}</dd>
            <dt className="text-muted">Medical</dt><dd className="whitespace-pre-wrap">{m.medical_notes || "—"}</dd>
          </dl>
        </Card>

        {/* ---------- targets */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Daily targets</h2>
          {targets ? (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Calories" value={fmt(targets.calories)} sub="kcal / day" />
                <Stat label="Protein" value={`${targets.protein_g} g`} sub={`${targets.protein_range_g[0]}–${targets.protein_range_g[1]} g`} />
                <Stat label="Carbs" value={`${targets.carbs_g} g`} />
                <Stat label="Fat" value={`${targets.fat_g} g`} sub={`${targets.fat_range_g[0]}–${targets.fat_range_g[1]} g`} />
              </div>
              <p className="mt-3 text-sm text-muted">
                BMR {fmt(targets.bmr)} kcal (Mifflin-St Jeor) × activity = maintenance {fmt(targets.tdee)} kcal.
              </p>
              {targets.notes.map((n) => <p key={n} className="mt-1 text-sm text-warn">{n}</p>)}
            </>
          ) : (
            <Notice tone="warn">{!eligibility.ok && eligibility.message}</Notice>
          )}
        </Card>
      </div>

      {/* ---------- diet plans */}
      <Card className="mt-4">
        <h2 className="mb-3 text-lg font-semibold">Diet plans</h2>
        {currentDiet && currentDietProblems.length > 0 && (
          <div className="mb-3">
            <Notice tone="error" title="The current diet plan no longer fits this member's profile">
              <ul className="list-disc pl-5">
                {currentDietProblems.slice(0, 5).map((e) => <li key={e}>{e}</li>)}
              </ul>
              <Link href={`/plans/${currentDiet.id}/edit`} className="mt-2 inline-block font-semibold underline">
                Fix the plan now
              </Link>
            </Notice>
          </div>
        )}
        <PlanList plans={dietPlans} empty="No diet plan yet." />
        <div className="mt-4">
          <CreateDietForms memberId={m.id} autoBlockedReason={eligibility.ok ? null : eligibility.message} />
        </div>
      </Card>

      {/* ---------- workout plans */}
      <Card className="mt-4">
        <h2 className="mb-3 text-lg font-semibold">Workout plans</h2>
        <PlanList plans={workoutPlans} empty="No workout plan yet." />
        <div className="mt-4">
          <CreateWorkoutForm memberId={m.id} suggested={suggestTemplate(m)} />
        </div>
      </Card>

      {/* ---------- weight */}
      <Card className="mt-4">
        <h2 className="mb-1 text-lg font-semibold">Weight history</h2>
        {change != null && (
          <p className="mb-3 text-muted">
            {change === 0 ? "No change" : `${change > 0 ? "+" : ""}${fmt(change, 1)} kg`} since {fmtDate(first!.logged_on)}
          </p>
        )}
        <WeightForm memberId={m.id} today={todayIso} />
        {weights.length === 0 ? (
          <div className="mt-4"><EmptyState title="No weights recorded yet" /></div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-muted">
                <tr><th className="py-2 pr-4 font-medium">Date</th><th className="py-2 pr-4 font-medium">Weight</th><th className="py-2 pr-4 font-medium">Note</th><th /></tr>
              </thead>
              <tbody>
                {weights.map((w) => (
                  <tr key={w.id} className="border-t border-line">
                    <td className="py-2 pr-4">{fmtDate(w.logged_on)}</td>
                    <td className="py-2 pr-4 font-semibold">{w.weight_kg} kg</td>
                    <td className="py-2 pr-4 text-muted">{w.note}</td>
                    <td className="py-2 text-right">
                      <form action={deleteWeight}>
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="member_id" value={m.id} />
                        <ConfirmButton question="Delete this entry?" confirmText="Delete">Delete</ConfirmButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function PlanList({ plans, empty }: { plans: PlanRow[]; empty: string }) {
  if (plans.length === 0) return <p className="text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {plans.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <Link href={`/plans/${p.id}/edit`} className="font-semibold hover:text-brand">{p.title || "Untitled plan"}</Link>
            <p className="text-sm text-muted">Updated {fmtDate(p.updated_at)}</p>
          </div>
          {p.status === "published" ? <Badge tone="green">Current (published)</Badge> : <Badge>Draft</Badge>}
          <Link href={`/plans/${p.id}/edit`} className={buttonClass("secondary")}>Edit</Link>
          <Link href={`/plans/${p.id}/print`} className={buttonClass("secondary")}>Print / PDF</Link>
        </li>
      ))}
    </ul>
  );
}
