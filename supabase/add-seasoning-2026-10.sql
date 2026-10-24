-- Seasoning: new category and 32 priced products. Run once in the Supabase SQL editor (safe to run again).
-- The category needs no SQL: it is just the text in each product's `category` column.
-- Needs the pack columns (first two lines add them if you have not run the earlier scripts).
alter table public.products add column if not exists pack_kg numeric(6, 2);
alter table public.products add column if not exists pack_label text;

-- Each price on your list is the price of ONE pack. price_per_kg = pack price / pack weight, so a pack costs
-- exactly the listed price. The pack size now lives in the description instead of the name.
-- Items with no size on the list use a pack with no weight (pack_label), so customers only see "N packs".
-- No photos yet, not featured, GST empty (the Seasoning rate from Admin > Website content > GST applies).
insert into public.products
  (id, name, category, price_per_kg, image, badge, description, is_egg, featured, active, in_stock, pack_kg, pack_label)
values
  ('aromatic-mix', 'Aromatic Mix', 'Seasoning', 278, '', null, '500 g pack', false, false, true, true, 0.5, null),
  ('chicken-broth-powder', 'Chicken Broth Powder', 'Seasoning', 436, '', 'New', '500 g pack', false, false, true, true, 0.5, null),
  ('chilli-flakes-sprinkler', 'Chilli Flakes Sprinkler', 'Seasoning', 518, '', 'New', '500 g pack', false, false, true, true, 0.5, null),
  ('chilli-garlic-sprinkler', 'Chilli Garlic Sprinkler', 'Seasoning', 394, '', null, '500 g pack', false, false, true, true, 0.5, null),
  ('crispy-cajun-breading-mix', 'Crispy Cajun Breading Mix', 'Seasoning', 278, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('dehydrated-garlic-powder', 'Dehydrated Garlic Powder', 'Seasoning', 277.78, '', null, '450 g pack', false, false, true, true, 0.45, null),
  ('dehydrated-onion-powder', 'Dehydrated Onion Powder', 'Seasoning', 382.5, '', null, '400 g pack', false, false, true, true, 0.4, null),
  ('extra-hot-and-spicy-marinade', 'Extra Hot and Spicy Marinade', 'Seasoning', 375, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('hot-chilli-flakes-sachets', 'Hot Chilli Flakes (Sachets)', 'Seasoning', 155, '', null, '', false, false, true, true, 1, 'pack of sachets'),
  ('indo-seasoning-magical', 'Indo Seasoning (Magical)', 'Seasoning', 824, '', null, '250 g pack', false, false, true, true, 0.25, null),
  ('mild-breading-mix', 'Mild Breading Mix', 'Seasoning', 262, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('onion-tomato-gravy-base', 'Onion Tomato Gravy Base', 'Seasoning', 126, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('oregano-spice-sprinkler', 'Oregano Spice Sprinkler', 'Seasoning', 510, '', null, '500 g pack', false, false, true, true, 0.5, null),
  ('oregano-spice-sprinkler-sachets', 'Oregano Spice Sprinkler (Sachets)', 'Seasoning', 155, '', null, '8 g sachets', false, false, true, true, 1, 'pack of sachets'),
  ('penne-pasta', 'Penne Pasta', 'Seasoning', 130, '', null, '500 g pack', false, false, true, true, 0.5, null),
  ('macaroni-pasta', 'Macaroni Pasta', 'Seasoning', 130, '', null, '500 g pack', false, false, true, true, 0.5, null),
  ('fusilli-pasta', 'Fusilli Pasta', 'Seasoning', 130, '', null, '500 g pack', false, false, true, true, 0.5, null),
  ('peri-peri-marinade-vkl', 'Peri Peri Marinade (VKL)', 'Seasoning', 422, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('piri-piri-sprinkler', 'Piri Piri Sprinkler', 'Seasoning', 540, '', null, '250 g pack', false, false, true, true, 0.25, null),
  ('pizza-dough-mix', 'Pizza Dough Mix', 'Seasoning', 312, '', null, '500 g pack', false, false, true, true, 0.5, null),
  ('pizza-pasta-tomato-base', 'Pizza Pasta Tomato Base', 'Seasoning', 165, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('white-gravy', 'White Gravy', 'Seasoning', 251, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('spaghetti-pasta', 'Spaghetti Pasta', 'Seasoning', 130, '', null, '500 g pack', false, false, true, true, 0.5, null),
  ('tandoori-tikka', 'Tandoori Tikka', 'Seasoning', 536, '', null, '500 g pack', false, false, true, true, 0.5, null),
  ('tomato-makhani-gravy-base', 'Tomato Makhani Gravy Base', 'Seasoning', 173, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('yellow-gravy-base', 'Yellow Gravy Base', 'Seasoning', 219, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('vkl-panko-breadcrumbs', 'VKL Panko Breadcrumbs', 'Seasoning', 130, '', null, '', false, false, true, true, 1, 'standard pack'),
  ('tomato-puree', 'Tomato Puree', 'Seasoning', 70.59, '', null, '850 g pack', false, false, true, true, 0.85, null),
  ('sweet-chilli-sauce', 'Sweet Chilli Sauce', 'Seasoning', 177, '', null, '', false, false, true, true, 1, 'standard pack'),
  ('chettinad-gravy', 'Chettinad Gravy', 'Seasoning', 237, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('dal-makhani', 'Dal Makhani', 'Seasoning', 163, '', null, '1 kg pack', false, false, true, true, 1, null),
  ('spicy-grill-marinade', 'Spicy Grill Marinade', 'Seasoning', 500, '', null, '1 kg pack', false, false, true, true, 1, null)
on conflict (id) do nothing;
