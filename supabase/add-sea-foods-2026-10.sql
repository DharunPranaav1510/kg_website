-- Processed Sea Foods: one new column for pack products, then three products.
-- Run this once in the Supabase SQL editor (safe to run again).
--
-- The category "Processed Sea Foods" needs no SQL: categories are just the text in each product's
-- `category` column, and the shop code already lists this category (shop filter, footer, tax list).

-- 1. Packs: how many kg one pack weighs. Null = sold by weight as before.
alter table public.products add column if not exists pack_kg numeric(6, 2);

-- 2. The three products. price_per_kg is the price for 1 kg; a pack costs price_per_kg x pack_kg
--    (Fish Fingers 1 kg pack = Rs 600, Crab Lollipop 1 kg pack = Rs 560, FNF G2 2.5 kg pack = Rs 875).
--    gst_rate is left empty, so the category rate set in Admin > Website content > GST applies.
--    No photo yet: the shop shows "Photo coming soon". Not featured, so not on the home page.
insert into public.products
  (id, name, category, price_per_kg, image, badge, description, is_egg, featured, active, in_stock, pack_kg, allowed_weights, gst_rate, hsn, schedule)
values
  ('fish-fingers', 'Fish Fingers', 'Processed Sea Foods', 600, '', null,
    '1 kg pack · about 40 pieces per pack', false, false, true, true, 1, null, null, null, null),
  ('crab-lollipop', 'Crab Lollipop', 'Processed Sea Foods', 560, '', null,
    '1 kg pack · about 30 pieces per pack', false, false, true, true, 1, null, null, null, null),
  ('fnf-g2-standard-indian-basha', 'FNF G2 Standard 2.5kg Indian Basha', 'Processed Sea Foods', 350, '', null,
    '2.5 kg pack · 6-7 fillets per pack', false, false, true, true, 2.5, null, null, null, null)
on conflict (id) do nothing;
