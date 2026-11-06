import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { asDietContent, asWorkoutContent, toMember, toPlan } from "@/lib/data";
import { DAY_NAMES, SLOT_LABELS } from "@/lib/nutrition/config";
import { dayTotal, itemNutrients } from "@/lib/nutrition/rules";
import { DIET_LABELS, GOAL_LABELS, fmt, fmtDate, fmtPortion } from "@/lib/labels";
import type { DietPlanContent, Member, WorkoutPlanContent } from "@/lib/types";
import { Notice, buttonClass } from "@/components/ui";
import { PrintButton } from "./PrintButton";

export default async function PrintPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (staff.status !== "staff") return null;
  const { id } = await params;

  const { data: row } = await staff.supabase.from("plans").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();
  const plan = toPlan(row);
  const { data: memberRow } = await staff.supabase.from("members").select("*").eq("id", plan.member_id).single();
  if (!memberRow) notFound();
  const member = toMember(memberRow);

  const diet = plan.type === "diet" ? asDietContent(plan.content) : null;
  const workout = plan.type === "workout" ? asWorkoutContent(plan.content) : null;

  return (
    <>
      <div className="no-print mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <Link href={`/plans/${plan.id}/edit`} className={buttonClass("secondary")}>Back to editing</Link>
        </div>
        <p className="text-muted">
          To send on WhatsApp: tap <b>Print / Save as PDF</b>, choose <b>Save as PDF</b>, then share the PDF file in
          WhatsApp.
        </p>
        {plan.status === "draft" && <Notice tone="warn">This plan is still a Draft.</Notice>}
      </div>

      <article className="print-page rounded-2xl border border-line bg-white p-6 text-black">
        <header className="mb-4 border-b border-gray-300 pb-3">
          <h1 className="text-2xl font-bold">{plan.title || (diet ? "Diet plan" : "Workout plan")}</h1>
          <p>
            <b>{member.full_name}</b> · {member.age} yrs · {member.weight_kg} kg · Goal: {GOAL_LABELS[member.goal]}
            {diet && <> · {DIET_LABELS[member.diet_type]}</>}
          </p>
          <p className="text-sm text-gray-600">Updated {fmtDate(plan.updated_at)}</p>
        </header>

        {diet && <DietPrint content={diet} member={member} />}
        {workout && <WorkoutPrint content={workout} />}
        {!diet && !workout && <p>This plan could not be read.</p>}

        <footer className="mt-6 border-t border-gray-300 pt-3 text-xs text-gray-600">
          General fitness guidance from your gym, not medical advice. If you have a health condition, are pregnant, or
          feel unwell, check with a doctor first. Stop any exercise that causes pain.
        </footer>
      </article>
    </>
  );
}

function DietPrint({ content, member }: { content: DietPlanContent; member: Member }) {
  const t = content.targets;
  const anyUnverified = content.days.some((d) => d.meals.some((m) => m.items.some((i) => !i.verified)));
  return (
    <>
      {t && (
        <p className="mb-3">
          Daily target: <b>{fmt(t.calories)} kcal</b> · Protein {t.protein_g} g · Carbs {t.carbs_g} g · Fat {t.fat_g} g
        </p>
      )}
      {member.allergies && <p className="mb-3"><b>Allergies:</b> {member.allergies}</p>}
      {content.days.map((d) => {
        const tot = dayTotal(d);
        return (
          <section key={d.day} className="print-break mb-4">
            <h2 className="mb-1 text-lg font-bold">
              {DAY_NAMES[d.day]} <span className="text-sm font-normal">({d.is_workout_day ? "workout day" : "rest day"})</span>
            </h2>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {d.meals.filter((m) => m.items.length > 0).map((m) => (
                  <tr key={m.slot} className="border-t border-gray-300 align-top">
                    <th className="w-36 py-1 pr-2 text-left font-semibold">{SLOT_LABELS[m.slot]}</th>
                    <td className="py-1">
                      {m.items.map((it, i) => (
                        <span key={i}>
                          {i > 0 && " + "}
                          {it.name} — {fmtPortion(it.servings, it.serving_desc, it.serving_size_g)}
                        </span>
                      ))}
                    </td>
                    <td className="w-20 py-1 text-right">{fmt(m.items.reduce((s, it) => s + itemNutrients(it).kcal, 0))} kcal</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-400 font-semibold">
                  <th className="py-1 pr-2 text-left">Total</th>
                  <td className="py-1">Protein {fmt(tot.protein_g)} g · Carbs {fmt(tot.carbs_g)} g · Fat {fmt(tot.fat_g)} g</td>
                  <td className="py-1 text-right">{fmt(tot.kcal)} kcal</td>
                </tr>
              </tbody>
            </table>
          </section>
        );
      })}
      {content.notes && <p className="mt-3 whitespace-pre-wrap"><b>Notes:</b> {content.notes}</p>}
      {anyUnverified && (
        <p className="mt-3 text-xs text-gray-600">Calorie and protein numbers are estimates and may vary with recipe and portion.</p>
      )}
    </>
  );
}

function WorkoutPrint({ content }: { content: WorkoutPlanContent }) {
  return (
    <>
      {content.days.map((d, di) => (
        <section key={di} className="print-break mb-4">
          <h2 className="mb-1 text-lg font-bold">{d.name}</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-1 pr-2">Exercise</th><th className="py-1 pr-2">Sets</th><th className="py-1 pr-2">Reps</th>
                <th className="py-1 pr-2">Rest</th><th className="py-1">Note</th>
              </tr>
            </thead>
            <tbody>
              {d.exercises.map((x, i) => (
                <tr key={i} className="border-t border-gray-300">
                  <td className="py-1 pr-2">{x.name}</td>
                  <td className="py-1 pr-2">{x.sets}</td>
                  <td className="py-1 pr-2">{x.reps}</td>
                  <td className="py-1 pr-2">{x.rest_sec ? `${x.rest_sec}s` : "—"}</td>
                  <td className="py-1">{x.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {content.notes && <p className="mt-3 whitespace-pre-wrap"><b>Notes:</b> {content.notes}</p>}
    </>
  );
}
