-- SEED DATA fix for databases loaded with the first seed (4 Nov 2026).
-- Whole wheat bread, vegetable pulao and moong dal khichdi are no longer picked as the
-- lunch/dinner roti-rice ("staple"): one plain roti or rice keeps cooking simple.
-- Only rows still holding the original seed roles are changed, so staff edits are kept.
update public.foods set roles = array['quick_carb']
  where lower(name) = 'whole wheat bread' and roles = array['staple', 'quick_carb'];
update public.foods set roles = '{}'
  where lower(name) = 'vegetable pulao' and roles = array['staple'];
update public.foods set roles = array['main_dish']
  where lower(name) = 'moong dal khichdi' and roles = array['staple', 'main_dish'];
