import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { toFood } from "@/lib/data";
import { CATEGORY_LABELS, DIET_LABELS, fmt } from "@/lib/labels";
import { FOOD_CATEGORIES } from "@/lib/types";
import { Badge, EmptyState, LinkButton, Notice, PageHeader, buttonClass } from "@/components/ui";

export const metadata = { title: "Foods — Gym Planner" };

export default async function FoodsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const staff = await getStaff();
  if (staff.status !== "staff") return null;
  const { q = "", cat = "" } = await searchParams;
  const search = q.replace(/[,()*%\\]/g, " ").trim().slice(0, 60);

  let query = staff.supabase.from("foods").select("*").order("name");
  if (search) query = query.ilike("name", `%${search}%`);
  if ((FOOD_CATEGORIES as readonly string[]).includes(cat)) query = query.eq("category", cat);
  const { data, error } = await query;
  const foods = (data ?? []).map(toFood);
  const unverified = foods.filter((f) => !f.verified).length;

  return (
    <>
      <PageHeader
        title="Foods"
        subtitle="Nutrition is per serving. The planner only uses active foods."
        actions={<LinkButton href="/foods/new">+ Add food</LinkButton>}
      />
      {unverified > 0 && (
        <div className="mb-4">
          <Notice tone="warn">
            {unverified} food(s) shown are not verified yet (⚠). Their numbers are starter estimates — check them
            against IFCT 2017 / USDA and tick “Verified”.
          </Notice>
        </div>
      )}

      <form className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
        <input name="q" defaultValue={q} placeholder="Search foods" aria-label="Search foods" className="input sm:flex-1" />
        <select name="cat" defaultValue={cat} aria-label="Category" className="input sm:w-56">
          <option value="">All categories</option>
          {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <button className={buttonClass("secondary")}>Search</button>
      </form>

      {error ? (
        <Notice tone="error" title="Could not load foods">Please refresh the page. ({error.message})</Notice>
      ) : foods.length === 0 ? (
        <EmptyState title="No foods found">Try another search, or add a food.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {foods.map((f) => (
            <li key={f.id}>
              <Link href={`/foods/${f.id}`} className="block rounded-2xl border border-line bg-card p-4 hover:border-brand">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">
                    {f.name} {!f.verified && <span className="text-warn" title="Not verified">⚠</span>}
                  </p>
                  {!f.is_active && <Badge>Inactive</Badge>}
                </div>
                <p className="text-sm text-muted">
                  {f.serving_desc || `${f.serving_size_g} g`} ({f.serving_size_g} g) · {fmt(f.kcal)} kcal · P {fmt(f.protein_g, 1)} · C {fmt(f.carbs_g, 1)} · F {fmt(f.fat_g, 1)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="green">{DIET_LABELS[f.diet_type]}</Badge>
                  <Badge>{CATEGORY_LABELS[f.category]}</Badge>
                  {f.allergens.length > 0 && <Badge tone="red">Contains: {f.allergens.map((a) => a.replace("_", " ")).join(", ")}</Badge>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
