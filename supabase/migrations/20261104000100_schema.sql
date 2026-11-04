-- =====================================================================
-- Gym Planner — Phase 1 schema
-- Tables: profiles, members, foods, exercises, plans, weight_logs
-- =====================================================================

-- ---------- shared: updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles (one row per login account) ----------
-- Staff accounts are created by the owner in the Supabase dashboard.
-- A new auth user always starts as role 'member' (no Phase 1 access);
-- the owner promotes staff with one SQL line (see README).
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'member' check (role in ('staff', 'member')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- members ----------
create table public.members (
  id                         uuid primary key default gen_random_uuid(),
  full_name                  text not null check (length(trim(full_name)) between 1 and 120),
  phone                      text check (phone is null or phone ~ '^[0-9+ -]{7,20}$'),
  age                        integer not null check (age between 10 and 100),
  sex                        text not null check (sex in ('male', 'female')),
  height_cm                  numeric(5,1) not null check (height_cm between 100 and 250),
  weight_kg                  numeric(5,1) not null check (weight_kg between 25 and 300),
  goal                       text not null check (goal in ('fat_loss', 'muscle_gain', 'maintenance', 'general_fitness')),
  activity_level             text not null check (activity_level in ('sedentary', 'light', 'moderate', 'very_active')),
  workouts_per_week          integer not null default 3 check (workouts_per_week between 0 and 7),
  experience                 text not null default 'beginner' check (experience in ('beginner', 'intermediate', 'advanced')),
  diet_type                  text not null check (diet_type in ('vegetarian', 'eggetarian', 'non_vegetarian', 'vegan')),
  allergies                  text not null default '',
  foods_to_avoid             text not null default '',
  daily_budget_inr           numeric(8,2) check (daily_budget_inr is null or daily_budget_inr >= 0),
  medical_notes              text not null default '',
  needs_professional_review  boolean not null default false,
  is_active                  boolean not null default true,
  created_by                 uuid references auth.users (id) on delete set null default auth.uid(),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index members_active_name_idx on public.members (is_active, full_name);

create trigger members_updated_at before update on public.members
  for each row execute function public.set_updated_at();

-- ---------- foods ----------
-- All nutrient values are PER SERVING (serving_size_g grams).
create table public.foods (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (length(trim(name)) between 1 and 120),
  category        text not null check (category in (
                    'grains', 'pulses', 'dairy', 'eggs', 'meat', 'fish', 'soy',
                    'vegetables', 'fruits', 'nuts_seeds', 'breakfast', 'snacks', 'beverages')),
  diet_type       text not null check (diet_type in ('vegan', 'vegetarian', 'eggetarian', 'non_vegetarian')),
  serving_size_g  numeric(7,1) not null check (serving_size_g > 0),
  serving_desc    text not null default '',
  kcal            numeric(7,1) not null check (kcal >= 0),
  protein_g       numeric(6,1) not null check (protein_g >= 0),
  carbs_g         numeric(6,1) not null check (carbs_g >= 0),
  fat_g           numeric(6,1) not null check (fat_g >= 0),
  fibre_g         numeric(6,1) not null default 0 check (fibre_g >= 0),
  allergens       text[] not null default '{}',
  roles           text[] not null default '{}',
  price_inr       numeric(8,2) check (price_inr is null or price_inr >= 0),
  source          text not null default '',
  verified        boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index foods_name_unique on public.foods (lower(name));

create trigger foods_updated_at before update on public.foods
  for each row execute function public.set_updated_at();

-- ---------- exercises ----------
create table public.exercises (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (length(trim(name)) between 1 and 120),
  target_muscle    text not null check (target_muscle in (
                     'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs', 'cardio')),
  equipment        text not null default 'none',
  difficulty       text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  default_sets     integer not null default 3 check (default_sets between 1 and 10),
  default_reps     text not null default '10-12' check (length(default_reps) between 1 and 30),
  default_rest_sec integer not null default 60 check (default_rest_sec between 0 and 600),
  instructions     text not null default '',
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index exercises_name_unique on public.exercises (lower(name));

create trigger exercises_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();

-- ---------- plans (diet + workout, content as JSON) ----------
create table public.plans (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members (id) on delete cascade,
  type        text not null check (type in ('diet', 'workout')),
  title       text not null default '' check (length(title) <= 120),
  status      text not null default 'draft' check (status in ('draft', 'published')),
  content     jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index plans_member_idx on public.plans (member_id, type, updated_at desc);

-- At most one published ("current") plan per member per type.
create unique index plans_one_published_per_type
  on public.plans (member_id, type) where status = 'published';

create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

-- ---------- weight_logs ----------
create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members (id) on delete cascade,
  logged_on   date not null default current_date,
  weight_kg   numeric(5,1) not null check (weight_kg between 25 and 300),
  note        text not null default '' check (length(note) <= 200),
  created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  unique (member_id, logged_on)
);

create index weight_logs_member_idx on public.weight_logs (member_id, logged_on desc);
