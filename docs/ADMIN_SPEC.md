# KG Foods admin: complete functional specification

Purpose: a handoff for anyone redesigning the admin. Everything below must keep working after a redesign. Sections 1 and 2 explain why login feels hard today. Sections 3 to 5 list every function. Section 6 lists data, APIs and rules that must not change. Section 7 lists the pain points and a suggested direction.

Stack: Next.js 16 (App Router), React 19, Tailwind 3, TypeScript, Supabase (Postgres + Auth + Storage), deployed on Vercel. All admin screens live under `/admin`, all admin APIs under `/api/admin`. Admin pages are `noindex`.

---

## 1. How login works today

### 1.1 Accounts
An admin needs two things at once:
1. A Supabase Auth user (email + password).
2. A row in the `admins` table with the same email (case-insensitive).

If either is missing, login fails with the same message ("Invalid email or password"), so the person cannot tell which part is wrong.

There is one fixed owner, `dpranaav@gmail.com` (in `src/lib/owner.ts`). Only the owner can add or remove admins (Section 3.14).

### 1.2 Steps
1. `/admin/login` shows email + password (with Show/Hide). If already signed in, it redirects to `/admin`.
2. `POST /api/admin/login` checks the password with Supabase, then checks the `admins` table.
3. If the account has two-step login (authenticator app) turned on, the server parks the half-finished login in a 5-minute cookie and the form switches to "Two-step login" asking for the 6-digit code. If the 5 minutes pass, the person is sent back to the password step.
4. `POST /api/admin/login/mfa` checks the code. On success the session cookies are set and the browser goes to `/admin`.
5. If `ADMIN_REQUIRE_MFA=true` and the account has no authenticator yet, the person can sign in with the password but sees only the "Set up two-step login" screen (QR code, secret, confirm with a first code). Nothing else in the admin is reachable until that is done.

### 1.3 Session
- Two cookies: access token (short-lived, Supabase default is about 1 hour) and refresh token (7 days). Both HttpOnly, SameSite=Strict, Secure in production.
- When the access token expires the next page load redirects through `GET /api/admin/refresh`, which swaps the refresh token for a new session and returns to `/admin`. If a background API call gets a 401, the browser is sent to `/api/admin/refresh` as a full page navigation.
- The server remembers "who is this token" for 30 seconds per server instance. Removing an admin can take up to 30 seconds to take effect.
- Logout revokes the session on Supabase. "Sign out of all devices" revokes every session.

### 1.4 Protections that must stay
- Wrong-password limits per 15 minutes: 5 tries per (email + device), 10 per device across emails, 40 per email across all devices. Wrong two-step codes: 10 per device.
- Origin check on every admin write (blocks requests from other sites).
- Every login, failed login, logout and security change is written to the activity log.
- An account that has an authenticator can never get in with a password alone (a session without the code is rejected everywhere).

---

## 2. Why login feels hard (found in the code)

1. **Two systems must agree** (Supabase user + `admins` row) and the error never says which one failed.
2. **Two-step login is heavy**: password, then an authenticator code within 5 minutes. A typo in the code is counted against a shared 10-try limit.
3. **No recovery**: no backup codes, no "forgot password", no "lost my phone". Recovery means editing Supabase by hand. (The email invite/reset idea was removed.)
4. **Strict cookies**: opening the admin from a link in WhatsApp, email or another site arrives without cookies, so the login form appears even though the person is signed in. A reload fixes it, which looks like a bug.
5. **Short sessions with abrupt redirects**: when the access token expires, an API call redirects the whole page, which can throw away an unsaved edit.
6. **Lockouts are silent**: the "too many attempts" message gives no countdown and no way to see who is locked.
7. **Setup mistakes look like wrong passwords**: wrong Supabase keys or URL show a separate generic server message, but a missing `admins` row shows "Invalid email or password".
8. **New admins**: the owner must type a password for them and tell them privately; the new person has no first-login or change-password screen.
9. **QR setup needs a second device** and is the first thing a new admin must do when `ADMIN_REQUIRE_MFA=true`.

---

## 3. Functions of the admin (screen by screen)

Navigation: left sidebar on desktop, slide-over menu on phones. Items, in order: Overview, Live orders (red badge with count of new orders), Order history, Products, Update prices, Offers, Sales, Feedback, Website content, Shop settings, Activity log, Security, Admins (owner only). Footer of the sidebar: signed-in email, "View shop", Log out. The sidebar also has a shop-status button (see 3.12) and polls `GET /api/admin/summary` for the badge and status.

### 3.1 Overview (`/admin`)
- Red banner when the shop is closed or paused (links to Shop settings).
- Four tiles: Waiting for confirmation (with the oldest age), Orders today (vs yesterday), Sales today (percent vs all of yesterday), Last order (how long ago).
- "Needs attention" list (orders waiting to be confirmed, products marked sold out), Recent orders, and quick links to the main pages.

### 3.2 Live orders (`/admin/orders`): the daily working screen
- Kanban of 4 columns: New, Confirmed, Out for delivery, Delivered. On phones one column at a time with tabs.
- Refreshes every 10 seconds while the tab is visible.
- New order alerts: optional sound, optional browser notification, "keep screen awake" option, tab title shows "(n) New orders".
- Each card: order number, age with colour (ok / warning / late based on minutes waiting: New 5/10, Confirmed 30/60, Out for delivery 45/90), customer name, items summary, total, slot, address, map link, phone, customer history hint ("First order", "3 earlier orders, 2 delivered", etc.), note, "Time since last order", "Top sellers today", "Orders by hour" chart.
- Actions: advance status (Confirm order, Out for delivery, Mark delivered), step back one status, Cancel (with confirm), Undo toast for 7 seconds, call, WhatsApp message prefilled per status, Print slip (small kitchen/delivery slip), Print bill (opens the full bill page), Block this phone number.
- Search by name, phone or order number.
- Staff phones the customer to confirm before moving to Confirmed (this is the verification method; there is no OTP).

### 3.3 Order history (`/admin/history`)
- All orders with filters Today / 7 days / 30 days and search (name, phone, email, order number).
- Change status from a dropdown, print slip, print bill, block number.

### 3.4 Bill (`/admin/bill/[id]`)
- Printable bill laid out like the shop's own receipt: legal name "KG BROILERS & EGGS", GSTIN, FSSAI, bill address and phone, bill number with a prefix (default "WEB"), customer and delivery details, item lines with HSN, quantity, rate, GST breakup, delivery charge, total, "State Name", footer message ("ALL IS WELL"), authorised signatory.
- Paper size toggle: 80 mm receipt or A4. Print button. Opening a bill is audit-logged.

### 3.5 Products (`/admin/products`)
- List with search, quick sold-out toggle ("Tap to toggle"), edit, delete, add, and a one-click "Import default products" when the table is empty.
- Product form (dialog): name, category, price per kg (per dozen for eggs), image (upload or URL), badge, description, flags: in stock, visible in shop, featured on home page, is egg (sold per dozen).
- Extras: allowed weights per product (grams, with standard sets for meat and eggs), GST rate override and HSN code, offer (price, label, start, end), selling schedule (days of the week, start and end time, date range, "hide when unavailable").
- Image upload: JPG/PNG/WebP only, real file type checked, max 4 MB, stored in the public `product-images` bucket.

### 3.6 Update prices (`/admin/prices`)
- Table of every product with editable price and in-stock switch, search, category chips.
- "% Adjust many at once": raise or lower the shown products by a percent or rupees, with rounding to 1, 5 or 10, then review and Save. Bulk save of up to 200 changes, each logged with old and new price.

### 3.7 Offers (`/admin/offers`)
- Shows each product's sales movement over the last 30 days so slow movers are easy to pick.
- Choose products, set percent off (1 to 90), label, optional start and end time (Indian time), apply to many at once; "Running now" list; remove offers.
- The storefront shows the old price crossed out.

### 3.8 Sales (`/admin/sales`)
- Range: Today, 7 days, 30 days, 90 days, This month, each compared with the previous period.
- Tiles: Sales, Orders, Average order, Cancelled. Charts: by hour, busiest weekdays, best sellers, by category, delivery slots chosen, new vs returning customers (by phone), "What stands out" insights.

### 3.9 Feedback (`/admin/feedback`)
- Ratings and comments customers leave after a delivered order, with average and star spread, linked order details.
- "Show on the website" copies a written comment into the public reviews (first name only).

### 3.10 Website content (`/admin/content`), tabs
- **Business details**: shop name pieces and contact (phone, WhatsApp, email), address, city, pincode, state, shop latitude/longitude, "Areas you deliver to", delivery (charge, free-above amount, minimum order, radius in km, delivery time slots), GST (on/off, prices include GST or not, rate per category, default frozen 5%), legal and bill details (legal name, GSTIN, FSSAI, bill address, bill phone, bill prefix, bill footer), grievance officer (name, email, phone), highlights, notice bar (show/hide, message, optional link). Opening hours are set in Shop settings, not here.
- **Policies**: Privacy, Terms, Refunds, Cancellation, Delivery. Rich text toolbar (bold, heading, bullet, link), title and subtitle, last-saved-by, up to 20 saved versions you can restore, "reset to built-in text".
- **Reviews**: add, edit, hide, reorder, delete. Customer name, quote, rating, product, role, place. (Photos were removed.)
- **FAQ**: question and answer items, add, edit, hide, reorder, delete.
- Until a list is edited the site shows built-in content; "copy defaults to database" starts editing.
- Changes go live immediately.

### 3.11 Opening hours (inside Shop settings)
- Weekly table, Monday first: each day open/closed with open and close time (default 6:30 AM to 5:00 PM every day), "use for all days".
- Special days: a date marked closed, or different hours, with a note (holiday, festival).
- Live preview of what customers see now. When closed, customers see the closed view and the server refuses orders. Customers can still browse.

### 3.12 Shop settings (`/admin/settings`)
- Pause orders now / Follow opening hours, with a message customers see (presets provided). Pause overrides the timetable.
- The sidebar button does the same in one tap and shows the real status: "Shop is open, closes 5:00 PM", "Shop is closed, opens tomorrow at 6:30 AM", or "Orders paused".
- Blocked phone numbers: add, list with reason, unblock. Blocked numbers cannot order.

### 3.13 Activity log (`/admin/activity`)
- Latest 300 admin actions: who, what, target, details (price changes show from and to). Covers logins, failed logins, logout, two-step changes, shop open/close, product create/edit/delete, price changes, imports, order status changes, number blocks, content, policy, business and hours changes, offers, bill prints, admin added/removed.

### 3.14 Security (`/admin/security`)
- Turn two-step login (authenticator app) on with a QR code or typed secret and a confirming code; turn it off unless `ADMIN_REQUIRE_MFA=true`.
- "Sign out of all devices".

### 3.15 Admins (`/admin/admins`, owner only)
- List admins, add one (email + a password of at least 10 characters creates the login; leave password empty if the person already has a login), remove one (owner cannot be removed). Logged in the activity log.

---

## 4. Customer-facing effects of admin actions (the admin must keep driving these)
- Product, price, stock, offers, schedule: storefront cache is refreshed immediately.
- Content, policies, business details, hours: refreshed immediately.
- Shop status (pause + hours): evaluated live in the customer's browser every 30 seconds and enforced again by the order API.
- Order status: the customer sees it on their order page, which refreshes itself.
- Delivery rules (radius, charge, minimum, slots, GST): applied by the server when pricing an order.

## 5. Rules and numbers that must be kept
- Indian time everywhere for hours, schedules and offers.
- Order flow: New, Confirmed, Out for delivery, Delivered, plus Cancelled. Staff confirms by phone call.
- Delivery: fixed charge (default ₹50), 6 km radius from the shop pin, "Deliver now" plus time slots.
- GST: 5% on frozen products (default), per-product override, bills show the breakup.
- Order numbers are sequential; bills use a prefix.

## 6. Data and API reference

Tables used by the admin: `orders`, `products`, `admins`, `settings` (keys `shop`, `business`, `hours`), `blocked_phones`, `order_feedback`, `testimonials`, `faqs`, `policies`, `policy_revisions`, `admin_audit`, rate-limit tables. Storage bucket: `product-images`. Row-level security is on with no public policies; only the server (service-role key) reads and writes.

Environment: `NEXT_PUBLIC_SUPABASE_URL`, Supabase anon/publishable key, `SUPABASE_SERVICE_ROLE_KEY` (server only), `ADMIN_REQUIRE_MFA`, optional Turnstile keys, `IP_HASH_SALT`, maintenance variables.

Every endpoint below requires a signed-in admin, an allowed Origin and (when required) completed two-step setup:

| Area | Endpoints |
| --- | --- |
| Login | `POST /api/admin/login`, `POST /api/admin/login/mfa`, `GET /api/admin/refresh`, `POST /api/admin/logout` (`?all=1` for all devices) |
| Two-step | `GET/DELETE /api/admin/mfa`, `POST /api/admin/mfa/enroll`, `POST /api/admin/mfa/verify` |
| Orders | `GET /api/admin/orders`, `PATCH /api/admin/orders/[id]` |
| Products | `GET/POST /api/admin/products`, `PUT/PATCH/DELETE /api/admin/products/[id]`, `PATCH /api/admin/products/bulk`, `POST /api/admin/products/seed`, `POST /api/admin/upload` |
| Offers | `GET/POST/DELETE /api/admin/offers` |
| Sales | `GET /api/admin/sales?range=` |
| Feedback | `GET /api/admin/feedback`, `POST /api/admin/feedback/[id]` |
| Content | `GET/PUT /api/admin/business`, `GET/POST/PUT /api/admin/content/[kind]` and `/[id]` (kinds: testimonials, faqs), `GET/PUT/DELETE /api/admin/policies/[slug]` |
| Shop | `GET/PUT /api/admin/shop`, `GET/PUT /api/admin/hours`, `GET/POST/DELETE /api/admin/blocked`, `GET /api/admin/summary` |
| Audit | `GET /api/admin/audit` |
| Admins (owner only) | `GET/POST/DELETE /api/admin/admins` |

---

## 7. Redesign brief

Keep: every function in Section 3, every protection in 1.4, the rules in Section 5, the API contract in Section 6 (or version it).

Fix (suggested):
- One clear login screen that says exactly what failed (wrong password, not an admin, locked for N more minutes, code expired).
- Keep the authenticator, but add backup codes, a "remember this device for 30 days" option, and a documented recovery path for a lost phone.
- Use `SameSite=Lax` for the session cookie so links from WhatsApp and email stay signed in (the Origin check already guards writes).
- Refresh the session quietly in the background instead of redirecting the page, and keep unsaved edits.
- Show who is locked out and let the owner clear it.
- New admin flow: owner creates the account, the new admin is forced to change the temporary password and set up two-step on first login.
- Optional later: a phone-first "orders only" mode for staff (Live orders, Print, Pause) separate from the owner's full console.

Open decisions for the owner: whether staff accounts should have limited roles (orders only vs. prices vs. full), whether password reset by email is wanted again, and how long "remember this device" should last.
