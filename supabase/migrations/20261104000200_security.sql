-- =====================================================================
-- Gym Planner — Phase 1 security
-- Staff can read/write everything. Anonymous users get nothing.
-- Members (Phase 2) get no access yet.
-- =====================================================================

-- Is the logged-in user a staff account?
-- SECURITY DEFINER so it can read profiles without recursive RLS checks.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff'
  );
$$;

revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- ---------- enable RLS everywhere ----------
alter table public.profiles    enable row level security;
alter table public.members     enable row level security;
alter table public.foods       enable row level security;
alter table public.exercises   enable row level security;
alter table public.plans       enable row level security;
alter table public.weight_logs enable row level security;

-- ---------- no anonymous access at all ----------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- ---------- profiles ----------
-- Everyone logged in can see their own profile (to know their role);
-- staff can see all. Roles are changed only by the owner via SQL / dashboard.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles: staff read all" on public.profiles
  for select to authenticated using (public.is_staff());

-- ---------- staff full access on business tables ----------
create policy "members: staff all" on public.members
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "foods: staff all" on public.foods
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "exercises: staff all" on public.exercises
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "plans: staff all" on public.plans
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "weight_logs: staff all" on public.weight_logs
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------- publish a plan atomically ----------
-- Un-publishes the member's previous plan of the same type, then publishes
-- this one, in one transaction. Runs as the caller, so RLS still applies.
create or replace function public.publish_plan(p_plan_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_member uuid;
  v_type   text;
begin
  if not public.is_staff() then
    raise exception 'Only staff can publish plans' using errcode = '42501';
  end if;

  select member_id, type into v_member, v_type
  from public.plans where id = p_plan_id;

  if v_member is null then
    raise exception 'Plan not found' using errcode = 'P0002';
  end if;

  update public.plans set status = 'draft'
  where member_id = v_member and type = v_type and status = 'published' and id <> p_plan_id;

  update public.plans set status = 'published' where id = p_plan_id;
end;
$$;

revoke all on function public.publish_plan(uuid) from public, anon;
grant execute on function public.publish_plan(uuid) to authenticated;
