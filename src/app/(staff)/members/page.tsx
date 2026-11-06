import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { toMember } from "@/lib/data";
import { DIET_LABELS, GOAL_LABELS } from "@/lib/labels";
import { Badge, EmptyState, LinkButton, Notice, PageHeader, buttonClass } from "@/components/ui";
import { ExportMenu } from "./ExportMenu";

export const metadata = { title: "Members — Fitness+ Gym" };

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  const staff = await getStaff();
  if (staff.status !== "staff") return null;
  const { q = "", show = "active" } = await searchParams;
  const search = q.replace(/[,()*%\\]/g, " ").trim().slice(0, 60);

  let query = staff.supabase.from("members").select("*").order("full_name");
  if (show !== "all") query = query.eq("is_active", show !== "inactive");
  if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
  const { data, error } = await query;
  const members = (data ?? []).map(toMember);

  return (
    <>
      <PageHeader
        title="Members"
        subtitle={error ? undefined : `${members.length} shown`}
        actions={<LinkButton href="/members/new">+ Add member</LinkButton>}
      />

      <form className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="q" className="sr-only">Search by name or phone</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by name or phone" className="input sm:flex-1" />
        <select name="show" defaultValue={show} className="input sm:w-48" aria-label="Which members">
          <option value="active">Active members</option>
          <option value="inactive">Inactive members</option>
          <option value="all">All members</option>
        </select>
        <button className={buttonClass("secondary")}>Search</button>
      </form>

      {error ? (
        <Notice tone="error" title="Could not load members">Please refresh the page. ({error.message})</Notice>
      ) : members.length === 0 ? (
        <EmptyState title={search ? "No members match your search" : "No members yet"}>
          {search ? "Try a different name or phone number." : "Tap “Add member” to add the first one."}
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <li key={m.id}>
              <Link
                href={`/members/${m.id}`}
                className="block rounded-2xl border border-line bg-card p-4 transition-colors hover:border-brand"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-semibold">{m.full_name}</p>
                  {!m.is_active && <Badge>Inactive</Badge>}
                </div>
                <p className="text-muted">
                  {m.age} yrs · {m.weight_kg} kg · {GOAL_LABELS[m.goal]}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="green">{DIET_LABELS[m.diet_type]}</Badge>
                  {m.needs_professional_review && <Badge tone="warn">Needs review</Badge>}
                  {m.age < 18 && <Badge tone="warn">Under 18</Badge>}
                  {m.allergies && <Badge tone="red">Allergies</Badge>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <ExportMenu />
      </div>
    </>
  );
}
