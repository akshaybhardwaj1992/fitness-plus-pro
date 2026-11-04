import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { toExercise } from "@/lib/data";
import { EXPERIENCE_LABELS, MUSCLE_LABELS } from "@/lib/labels";
import { MUSCLES } from "@/lib/types";
import { Badge, EmptyState, LinkButton, Notice, PageHeader, buttonClass } from "@/components/ui";

export const metadata = { title: "Exercises — Gym Planner" };

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; muscle?: string }>;
}) {
  const staff = await getStaff();
  if (staff.status !== "staff") return null;
  const { q = "", muscle = "" } = await searchParams;
  const search = q.replace(/[,()*%\\]/g, " ").trim().slice(0, 60);

  let query = staff.supabase.from("exercises").select("*").order("target_muscle").order("name");
  if (search) query = query.ilike("name", `%${search}%`);
  if ((MUSCLES as readonly string[]).includes(muscle)) query = query.eq("target_muscle", muscle);
  const { data, error } = await query;
  const exercises = (data ?? []).map(toExercise);

  return (
    <>
      <PageHeader title="Exercises" actions={<LinkButton href="/exercises/new">+ Add exercise</LinkButton>} />

      <form className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
        <input name="q" defaultValue={q} placeholder="Search exercises" aria-label="Search exercises" className="input sm:flex-1" />
        <select name="muscle" defaultValue={muscle} aria-label="Muscle" className="input sm:w-48">
          <option value="">All muscles</option>
          {MUSCLES.map((m) => <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>)}
        </select>
        <button className={buttonClass("secondary")}>Search</button>
      </form>

      {error ? (
        <Notice tone="error" title="Could not load exercises">Please refresh the page. ({error.message})</Notice>
      ) : exercises.length === 0 ? (
        <EmptyState title="No exercises found">Try another search, or add an exercise.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {exercises.map((x) => (
            <li key={x.id}>
              <Link href={`/exercises/${x.id}`} className="block h-full rounded-2xl border border-line bg-card p-4 hover:border-brand">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{x.name}</p>
                  {!x.is_active && <Badge>Inactive</Badge>}
                </div>
                <p className="text-sm text-muted">
                  {x.default_sets} × {x.default_reps} · rest {x.default_rest_sec}s · {x.equipment}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="green">{MUSCLE_LABELS[x.target_muscle]}</Badge>
                  <Badge>{EXPERIENCE_LABELS[x.difficulty]}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
