-- How much cooking the member can do. Used by the diet planner.
--   simple  = one dal/curry + one sabzi cooked per day, eaten at lunch and dinner (default)
--   variety = different dishes at lunch and dinner
alter table public.members
  add column cooking_style text not null default 'simple'
  check (cooking_style in ('simple', 'variety'));
