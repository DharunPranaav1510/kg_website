-- Adds four chicken products. Safe to run once in the Supabase SQL editor.
-- Each one: not featured (so not on the home page), GST 0 (no tax), no schedule (sold every day),
-- no photo yet (the shop shows "Photo coming soon"; add photos later in Admin > Products).
-- Prices are per kg. allowed_weights are the quantities (in kg) customers can pick.
-- Re-running is harmless: rows that already exist (same id) are left alone.

insert into public.products
  (id, name, category, price_per_kg, image, badge, description, is_egg, featured, active, in_stock, allowed_weights, gst_rate, hsn, schedule)
values
  ('chicken-wings', 'Chicken Wings', 'Chicken', 300, '', null, '', false, false, true, true,
    array[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5]::numeric[], 0, null, null),
  ('chicken-gizzard', 'Chicken Gizzard', 'Chicken', 220, '', null, '', false, false, true, true,
    array[0.25, 0.5, 0.75, 1]::numeric[], 0, null, null),
  ('chicken-liver', 'Chicken Liver', 'Chicken', 200, '', null, '', false, false, true, true,
    array[0.25, 0.5, 0.75, 1]::numeric[], 0, null, null),
  ('chicken-keema', 'Chicken Keema', 'Chicken', 450, '', null, '', false, false, true, true,
    array[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5]::numeric[], 0, null, null)
on conflict (id) do nothing;
