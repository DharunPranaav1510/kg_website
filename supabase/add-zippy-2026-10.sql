-- All Zippy products, in Ready To Cook, with a 10% offer. Run once in the Supabase SQL editor (safe to run again).
-- Needs the pack columns (the first two lines add them if you have not run the earlier scripts).
alter table public.products add column if not exists pack_kg numeric(6, 2);
alter table public.products add column if not exists pack_label text;
alter table public.products add column if not exists gst_inclusive boolean; -- true = the price already includes this product's GST

-- Price = the "Purchase Price MRP" column, per pack (NET PRICE PER PKT is ignored).
-- price_per_kg = pack price / pack weight, so a pack costs exactly the MRP. The pack size and pieces are in the description.
-- offer_price is the 10% offer, rounded to a whole rupee per pack (e.g. MRP 489 -> offer 440), shown with the MRP crossed out.
-- No end date: the offer stays until you remove it (Admin > Offers). No photos yet, not featured.
-- GST: 5%, already included in the MRP (gst_rate = 5, gst_inclusive = true). The bill splits it out of the price;
-- nothing is added at checkout for these items. Other products keep following the shop-wide GST setting.
insert into public.products
  (id, name, category, price_per_kg, image, badge, description, is_egg, featured, active, in_stock, pack_kg, pack_label, offer_price, offer_label, gst_rate, gst_inclusive)
values
  ('zippy-chicken-nuggets', 'Zippy Chicken Nuggets', 'Ready To Cook', 489, '', null, '1 kg pack · 40-45 pieces per pack', false, false, true, true, 1, null, 440, '10% off', 5, true),
  ('zippy-chicken-fingers', 'Zippy Chicken Fingers', 'Ready To Cook', 506, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 455, '10% off', 5, true),
  ('zippy-chicken-cheese-finger', 'Zippy Chicken Cheese Finger', 'Ready To Cook', 573, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 516, '10% off', 5, true),
  ('zippy-chicken-burger-patty', 'Zippy Chicken Burger Patty', 'Ready To Cook', 470, '', null, '1 kg pack · 12 pieces per pack', false, false, true, true, 1, null, 423, '10% off', 5, true),
  ('zippy-chicken-kiddy-patty', 'Zippy Chicken Kiddy Patty', 'Ready To Cook', 470, '', null, '1 kg pack · 20 pieces per pack', false, false, true, true, 1, null, 423, '10% off', 5, true),
  ('zippy-chicken-cutlet', 'Zippy Chicken Cutlet', 'Ready To Cook', 480, '', null, '1 kg pack · 30 pieces per pack', false, false, true, true, 1, null, 432, '10% off', 5, true),
  ('zippy-grilled-chicken-burger-patty', 'Zippy Grilled Chicken Burger Patty', 'Ready To Cook', 426, '', null, '1 kg pack · 12 pieces per pack', false, false, true, true, 1, null, 383, '10% off', 5, true),
  ('zippy-chicken-popcorn', 'Zippy Chicken Popcorn', 'Ready To Cook', 541, '', null, '1 kg pack · 125-140 pieces per pack', false, false, true, true, 1, null, 487, '10% off', 5, true),
  ('zippy-chicken-kievs', 'Zippy Chicken Kievs', 'Ready To Cook', 577, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 519, '10% off', 5, true),
  ('zippy-chicken-bites', 'Zippy Chicken Bites', 'Ready To Cook', 601, '', null, '1 kg pack · 100 pieces per pack', false, false, true, true, 1, null, 541, '10% off', 5, true),
  ('zippy-chicken-breaded-strips', 'Zippy Chicken Breaded Strips', 'Ready To Cook', 732, '', null, '1 kg pack · 24-26 pieces per pack', false, false, true, true, 1, null, 659, '10% off', 5, true),
  ('zippy-chicken-breaded-wings', 'Zippy Chicken Breaded Wings', 'Ready To Cook', 629, '', null, '1 kg pack · 24-26 pieces per pack', false, false, true, true, 1, null, 566, '10% off', 5, true),
  ('zippy-chicken-breaded-lollypop', 'Zippy Chicken Breaded Lollypop', 'Ready To Cook', 694, '', null, '1 kg pack · 24-26 pieces per pack', false, false, true, true, 1, null, 625, '10% off', 5, true),
  ('zippy-chicken-zinger-burger-patty-bf', 'Zippy Chicken Zinger Burger Patty BF', 'Ready To Cook', 694, '', null, '1 kg pack · 12 pieces per pack', false, false, true, true, 1, null, 625, '10% off', 5, true),
  ('zippy-chicken-samosa', 'Zippy Chicken Samosa', 'Ready To Cook', 530, '', null, '500 g pack · 22 pieces per pack', false, false, true, true, 0.5, null, 478, '10% off', 5, true),
  ('zippy-chicken-breaded-samosa', 'Zippy Chicken Breaded Samosa', 'Ready To Cook', 470, '', null, '500 g pack · 20 pieces per pack', false, false, true, true, 0.5, null, 424, '10% off', 5, true),
  ('zippy-chicken-spring-roll', 'Zippy Chicken Spring Roll', 'Ready To Cook', 1122, '', null, '500 g pack · 13 pieces per pack', false, false, true, true, 0.5, null, 1010, '10% off', 5, true),
  ('zippy-chicken-breakfast-sausage', 'Zippy Chicken Breakfast Sausage', 'Ready To Cook', 450, '', null, '1 kg pack · 28-30 pieces per pack', false, false, true, true, 1, null, 405, '10% off', 5, true),
  ('zippy-chicken-salami', 'Zippy Chicken Salami', 'Ready To Cook', 448, '', null, '1 kg pack · 56-60 pieces per pack', false, false, true, true, 1, null, 403, '10% off', 5, true),
  ('zippy-chicken-hot-dog', 'Zippy Chicken Hot Dog', 'Ready To Cook', 452, '', null, '1 kg pack · 18-20 pieces per pack', false, false, true, true, 1, null, 407, '10% off', 5, true),
  ('zippy-chicken-cocktail-sausage', 'Zippy Chicken Cocktail Sausage', 'Ready To Cook', 461, '', null, '1 kg pack · 45-50 pieces per pack', false, false, true, true, 1, null, 415, '10% off', 5, true),
  ('zippy-chicken-franks', 'Zippy Chicken Franks', 'Ready To Cook', 461, '', null, '1 kg pack · 18-20 pieces per pack', false, false, true, true, 1, null, 415, '10% off', 5, true),
  ('zippy-chicken-red-spicy-sausage', 'Zippy Chicken Red Spicy Sausage', 'Ready To Cook', 433, '', null, '1 kg pack · 28-30 pieces per pack', false, false, true, true, 1, null, 390, '10% off', 5, true),
  ('zippy-chicken-pepperoni', 'Zippy Chicken Pepperoni', 'Ready To Cook', 586, '', null, '500 g pack · 100 pieces per pack', false, false, true, true, 0.5, null, 528, '10% off', 5, true),
  ('zippy-chicken-ham', 'Zippy Chicken Ham', 'Ready To Cook', 608, '', null, '500 g pack · 19-20 pieces per pack', false, false, true, true, 0.5, null, 548, '10% off', 5, true),
  ('zippy-chicken-bacon', 'Zippy Chicken Bacon', 'Ready To Cook', 556, '', null, '500 g pack · 23-25 pieces per pack', false, false, true, true, 0.5, null, 500, '10% off', 5, true),
  ('zippy-chicken-seekh-kebab', 'Zippy Chicken Seekh Kebab', 'Ready To Cook', 560, '', null, '1 kg pack · 14-15 pieces per pack', false, false, true, true, 1, null, 504, '10% off', 5, true),
  ('zippy-veg-lollypop', 'Zippy Veg Lollypop', 'Ready To Cook', 452, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 407, '10% off', 5, true),
  ('zippy-veg-nuggets', 'Zippy Veg Nuggets', 'Ready To Cook', 373, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 336, '10% off', 5, true),
  ('zippy-veg-finger', 'Zippy Veg Finger', 'Ready To Cook', 358, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 322, '10% off', 5, true),
  ('zippy-veg-cutlet', 'Zippy Veg Cutlet', 'Ready To Cook', 396, '', null, '1 kg pack · 28-30 pieces per pack', false, false, true, true, 1, null, 356, '10% off', 5, true),
  ('zippy-veg-burger-patty-20-pcs', 'Zippy Veg Burger Patty (20 Pcs)', 'Ready To Cook', 312, '', null, '1 kg pack · 20 pieces per pack', false, false, true, true, 1, null, 281, '10% off', 5, true),
  ('zippy-veg-burger-patty-12-pcs', 'Zippy Veg Burger Patty (12 Pcs)', 'Ready To Cook', 312, '', null, '1 kg pack · 12 pieces per pack', false, false, true, true, 1, null, 281, '10% off', 5, true),
  ('zippy-veg-samosa', 'Zippy Veg Samosa', 'Ready To Cook', 436, '', null, '500 g pack · 22 pieces per pack', false, false, true, true, 0.5, null, 392, '10% off', 5, true),
  ('zippy-veg-spring-roll', 'Zippy Veg Spring Roll', 'Ready To Cook', 434, '', null, '500 g pack · 13 pieces per pack', false, false, true, true, 0.5, null, 390, '10% off', 5, true),
  ('zippy-veg-breaded-roll', 'Zippy Veg Breaded Roll', 'Ready To Cook', 378, '', null, '500 g pack · 12 pieces per pack', false, false, true, true, 0.5, null, 340, '10% off', 5, true),
  ('zippy-cheese-corn-nuggets', 'Zippy Cheese Corn Nuggets', 'Ready To Cook', 405, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 365, '10% off', 5, true),
  ('zippy-cheese-and-jalapeno-sorts', 'Zippy Cheese and Jalapeno Sorts', 'Ready To Cook', 405, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 365, '10% off', 5, true),
  ('zippy-sweet-corn-cutlet', 'Zippy Sweet Corn Cutlet', 'Ready To Cook', 373, '', null, '1 kg pack · 48-50 pieces per pack', false, false, true, true, 1, null, 336, '10% off', 5, true),
  ('zippy-paneer-patty-round', 'Zippy Paneer Patty Round', 'Ready To Cook', 657, '', null, '1 kg pack · 20 pieces per pack', false, false, true, true, 1, null, 591, '10% off', 5, true),
  ('zippy-paneer-patty-square', 'Zippy Paneer Patty Square', 'Ready To Cook', 657, '', null, '1 kg pack · 20 pieces per pack', false, false, true, true, 1, null, 591, '10% off', 5, true),
  ('zippy-paneer-pops', 'Zippy Paneer Pops', 'Ready To Cook', 622, '', null, '1 kg pack · 100-110 pieces per pack', false, false, true, true, 1, null, 560, '10% off', 5, true),
  ('zippy-paneer-nuggets', 'Zippy Paneer Nuggets', 'Ready To Cook', 622, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 560, '10% off', 5, true),
  ('zippy-paneer-finger', 'Zippy Paneer Finger', 'Ready To Cook', 622, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 560, '10% off', 5, true),
  ('zippy-paneer-cutlet', 'Zippy Paneer Cutlet', 'Ready To Cook', 457, '', null, '1 kg pack · 48-50 pieces per pack', false, false, true, true, 1, null, 411, '10% off', 5, true),
  ('zippy-paneer-sticks', 'Zippy Paneer Sticks', 'Ready To Cook', 657, '', null, '1 kg pack · 48-50 pieces per pack', false, false, true, true, 1, null, 591, '10% off', 5, true),
  ('zippy-paneer-samosa', 'Zippy Paneer Samosa', 'Ready To Cook', 594, '', null, '500 g pack · 22 pieces per pack', false, false, true, true, 0.5, null, 534, '10% off', 5, true),
  ('zippy-paneer-spring-roll', 'Zippy Paneer Spring Roll', 'Ready To Cook', 534, '', null, '500 g pack · 13 pieces per pack', false, false, true, true, 0.5, null, 480, '10% off', 5, true),
  ('zippy-paneer-breaded-roll', 'Zippy Paneer Breaded Roll', 'Ready To Cook', 508, '', null, '500 g pack · 12 pieces per pack', false, false, true, true, 0.5, null, 458, '10% off', 5, true),
  ('zippy-mushroom-burger-patty', 'Zippy Mushroom Burger Patty', 'Ready To Cook', 467, '', null, '1 kg pack · 20 pieces per pack', false, false, true, true, 1, null, 420, '10% off', 5, true),
  ('zippy-mushroom-pops', 'Zippy Mushroom Pops', 'Ready To Cook', 459, '', null, '1 kg pack · 125-140 pieces per pack', false, false, true, true, 1, null, 413, '10% off', 5, true),
  ('zippy-mushroom-nuggets', 'Zippy Mushroom Nuggets', 'Ready To Cook', 467, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 420, '10% off', 5, true),
  ('zippy-mushroom-finger', 'Zippy Mushroom Finger', 'Ready To Cook', 467, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 420, '10% off', 5, true),
  ('zippy-mushroom-cutlet', 'Zippy Mushroom Cutlet', 'Ready To Cook', 467, '', null, '1 kg pack · 48-50 pieces per pack', false, false, true, true, 1, null, 420, '10% off', 5, true),
  ('zippy-mushroom-kievs', 'Zippy Mushroom Kievs', 'Ready To Cook', 525, '', null, '1 kg pack · 48-52 pieces per pack', false, false, true, true, 1, null, 473, '10% off', 5, true),
  ('zippy-veg-momos', 'Zippy Veg Momos', 'Ready To Cook', 434, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 390, '10% off', 5, true),
  ('zippy-veg-schezwan-momos', 'Zippy Veg Schezwan Momos', 'Ready To Cook', 452, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 406, '10% off', 5, true),
  ('zippy-cheese-corn-momos', 'Zippy Cheese Corn Momos', 'Ready To Cook', 604, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 544, '10% off', 5, true),
  ('zippy-mushroom-momos', 'Zippy Mushroom Momos', 'Ready To Cook', 604, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 544, '10% off', 5, true),
  ('zippy-paneer-tikka-momos', 'Zippy Paneer Tikka Momos', 'Ready To Cook', 594, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 534, '10% off', 5, true),
  ('zippy-paneer-momos', 'Zippy Paneer Momos', 'Ready To Cook', 556, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 500, '10% off', 5, true),
  ('zippy-mixed-stuffed-veg-bao-buns', 'Zippy Mixed Stuffed Veg Bao Buns', 'Ready To Cook', 556, '', null, '500 g pack · 10 pieces per pack', false, false, true, true, 0.5, null, 500, '10% off', 5, true),
  ('zippy-chicken-momos', 'Zippy Chicken Momos', 'Ready To Cook', 482, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 434, '10% off', 5, true),
  ('zippy-chicken-schezwan-momos', 'Zippy Chicken Schezwan Momos', 'Ready To Cook', 508, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 458, '10% off', 5, true),
  ('zippy-chicken-peri-peri-momos', 'Zippy Chicken Peri Peri Momos', 'Ready To Cook', 508, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 458, '10% off', 5, true),
  ('zippy-chicken-tikka-momos', 'Zippy Chicken Tikka Momos', 'Ready To Cook', 526, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 474, '10% off', 5, true),
  ('zippy-chicken-cheese-momos', 'Zippy Chicken Cheese Momos', 'Ready To Cook', 602, '', null, '500 g pack · 25 pieces per pack', false, false, true, true, 0.5, null, 542, '10% off', 5, true)
on conflict (id) do nothing;

-- If you already ran the earlier Zippy script, this brings those rows up to date (harmless otherwise).
update public.products set gst_rate = 5, gst_inclusive = true where id like 'zippy-%';
