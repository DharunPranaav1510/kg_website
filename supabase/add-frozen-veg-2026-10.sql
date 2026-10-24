-- Frozen and processed veg items for Ready To Cook. Run once in the Supabase SQL editor (safe to run again).
-- Needs the pack columns from add-sea-foods-2026-10.sql; the first two lines add them if you have not run that yet.
alter table public.products add column if not exists pack_kg numeric(6, 2);
alter table public.products add column if not exists pack_label text;

-- price_per_kg = (price of one pack) / (kg in one pack), so a pack costs exactly the price on your sheet.
-- Pieces per pack are in the description; "NA" is left out. No photo yet, not featured, GST empty (category rate applies).
insert into public.products
  (id, name, category, price_per_kg, image, badge, description, is_egg, featured, active, in_stock, pack_kg, pack_label)
values
  ('aloo-tikki-1-5kg-hyfun', 'ALOO TIKKI 1.5KG Hyfun', 'Ready To Cook', 153.33, '', null, '1.5 kg pack · 36 pieces per pack', false, false, true, true, 1.5, null),
  ('chilli-garlic-potato-poppers-1-5kg-hyfun', 'CHILLI Garlic Potato Poppers 1.5kg Hyfun', 'Ready To Cook', 216.67, '', null, '1.5 kg pack · 176 pieces per pack', false, false, true, true, 1.5, null),
  ('crispy-veggie-bite-1kg-hyfun', 'Crispy Veggie Bite 1kg Hyfun', 'Ready To Cook', 230, '', null, '1 kg pack · 75 pieces per pack', false, false, true, true, 1, null),
  ('french-fries-6mm-hyfun', 'French Fries 6mm Hyfun', 'Ready To Cook', 120, '', null, '2.5 kg pack', false, false, true, true, 2.5, null),
  ('french-fries-9mm-hyfun', 'French Fries 9mm Hyfun', 'Ready To Cook', 120, '', null, '2.5 kg pack', false, false, true, true, 2.5, null),
  ('hash-brown-hyfun', 'Hash Brown Hyfun', 'Ready To Cook', 186.67, '', null, '1.5 kg pack · 46 pieces per pack', false, false, true, true, 1.5, null),
  ('masala-fries-1kg-hyfun', 'Masala Fries 1kg Hyfun', 'Ready To Cook', 210, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('ohh-french-fries-6mm-hyfun', 'ohh French Fries 6mm Hyfun', 'Ready To Cook', 100, '', null, '2.5 kg pack', false, false, true, true, 2.5, null),
  ('veg-burger-patty-hyfun-1200gm', 'VEG BURGER PATTY-HYFUN 1200gm', 'Ready To Cook', 166.67, '', null, '1.2 kg pack · 20 pieces per pack', false, false, true, true, 1.2, null),
  ('crinkle-fries-1kg-hyfun', 'Crinkle Fries 1kg Hyfun', 'Ready To Cook', 175, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('frozen-grated-coconut', 'FROZEN GRATED COCONUT', 'Ready To Cook', 100, '', null, '2 kg pack', false, false, true, true, 2, null),
  ('frozen-green-peas', 'Frozen Green Peas', 'Ready To Cook', 80, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('frozen-green-peas-safal', 'Frozen Green Peas Safal', 'Ready To Cook', 85, '', null, '5 kg pack', false, false, true, true, 5, null),
  ('mc-cain-favorita-fries-6mm-2-5-kg', 'Mc Cain Favorita Fries 6mm 2.5 Kg', 'Ready To Cook', 108, '', null, '2.5 kg pack', false, false, true, true, 2.5, null),
  ('mc-cain-favorita-fries-9mm-2-5-kg', 'Mc Cain Favorita Fries 9mm 2.5 Kg', 'Ready To Cook', 108, '', null, '2.5 kg pack', false, false, true, true, 2.5, null),
  ('mc-cain-smiles-1-5kg', 'Mc Cain Smiles 1.5kg', 'Ready To Cook', 260, '', null, '1.5 kg pack', false, false, true, true, 1.5, null),
  ('potato-kievs-convenio', 'Potato Kievs - Convenio', 'Ready To Cook', 300, '', null, '1 kg pack · 50 pieces per pack', false, false, true, true, 1, null),
  ('savoury-wedges-2-5kg', 'SAVOURY WEDGES 2.5KG', 'Ready To Cook', 182, '', null, '2.5 kg pack', false, false, true, true, 2.5, null),
  ('sweet-corn-1p-1kg', 'SWEET CORN 1P-1KG', 'Ready To Cook', 80, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('swiss-marcote-pizza-flour-20kg', 'Swiss Marcote Pizza Flour 20kg', 'Ready To Cook', 131, '', null, '20 kg pack', false, false, true, true, 20, null),
  ('veg-chap-1kg', 'Veg Chap 1kg', 'Ready To Cook', 165, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('veg-nuggets-convenio', 'Veg Nuggets-Convenio', 'Ready To Cook', 240, '', null, '1 kg pack · 48 pieces per pack', false, false, true, true, 1, null),
  ('tortilla-10', 'Tortilla 10" (10 P)', 'Ready To Cook', 100, '', null, 'Pack of 10 pieces', false, false, true, true, 1, 'pack of 10 pieces'),
  ('tortilla-mspl-8', 'Tortilla MSPL-8" (10 p)', 'Ready To Cook', 80, '', null, 'Pack of 10 pieces', false, false, true, true, 1, 'pack of 10 pieces')
on conflict (id) do nothing;

-- Veggie Stix 1kg Hyfun had no price or pack size on the sheet, so it is added hidden. Set the price and show it from Admin > Products.
insert into public.products
  (id, name, category, price_per_kg, image, badge, description, is_egg, featured, active, in_stock, pack_kg, pack_label)
values
  ('veggie-stix-1kg-hyfun', 'Veggie Stix 1kg Hyfun', 'Ready To Cook', 0, '', null, '1 kg pack', false, false, false, true, 1, null)
on conflict (id) do nothing;
