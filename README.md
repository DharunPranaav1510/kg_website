# KG Foods Website

A modern Next.js e-commerce website for KG Foods, featuring a beautiful UI built with React and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Email**: [Resend](https://resend.com/)
- **Language**: TypeScript

## Project Structure

```
├── src/
│   ├── app/              # Next.js app directory (pages, layouts, API routes)
│   ├── components/       # Reusable React components
│   ├── context/          # React context providers (e.g., CartContext)
│   ├── data/             # Static data files (products, categories, etc.)
│   └── lib/              # Utility functions (SEO helpers, etc.)
├── public/               # Static assets (images, PDFs, etc.)
├── images_raw/           # Raw image files (not deployed)
└── pyscraper.py         # Python utility for data scraping
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3001 in your browser
```

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file in the root directory (not committed to git):

```env
# Add any required API keys or environment variables here
```

## Deployment on Vercel

### Option 1: Deploy via GitHub (Recommended)

1. Go to [Vercel](https://vercel.com) and sign up/log in
2. Click "Add New..." → "Project"
3. Import the GitHub repository: `https://github.com/DharunPranaav1510/kg_website.git`
4. Vercel will auto-detect Next.js settings
5. Click "Deploy" and wait for the build to complete

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to project directory
cd "/Users/dharunpranaav/Projects/kg website"

# Deploy
vercel

# For production deployment
vercel --prod
```

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks

## Features

- ✅ Responsive design (mobile-first)
- ✅ SEO optimized (Next.js metadata, structured data)
- ✅ Product catalog with categories
- ✅ Shopping cart functionality (context-based)
- ✅ Contact form with email integration
- ✅ Blog section
- ✅ Customer testimonials
- ✅ Legal pages (Terms, Privacy, Refunds, Careers)
- ✅ About page

## API Routes

- `POST /api/contact` - Handle contact form submissions
- `POST /api/order` - Handle order submissions

## Performance Tips

- Images are optimized with Next.js Image component
- Tailwind CSS is purged for production
- Code splitting happens automatically with Next.js

## Troubleshooting

### Build fails on Vercel
- Ensure `package-lock.json` is committed
- Check for environment variable requirements
- Verify all dependencies are listed in `package.json`

### Images not loading
- Ensure images are in `/public` directory
- Use Next.js `Image` component from `next/image`

## License

Proprietary - KG Foods

## Support

For issues or questions, please contact the development team.

## Database (Supabase)

1. Create a free project at https://supabase.com.
2. SQL Editor -> paste and run `supabase/schema.sql`.
3. Project Settings -> API: copy the Project URL and the `service_role` key into `.env.local` (and Vercel env vars):
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   RESEND_API_KEY=re_...
   ```
   The service_role key is server-only; never expose it to the browser.

Orders and enquiries are saved to the `orders` / `enquiries` tables, then emailed. If the Supabase vars are missing, only the email is sent.

## Admin panel

Admins manage products at `/admin` (add, edit price, hide, delete, upload photos).

1. Run the updated `supabase/schema.sql` in the Supabase SQL Editor (adds `products`, `admins` and the `product-images` bucket).
2. Supabase -> Authentication -> Sign In / Providers: turn **off** "Allow new users to sign up".
3. Supabase -> Authentication -> Users -> **Add user** (email + password, tick "Auto Confirm User").
4. Allow that email in the SQL Editor: `insert into public.admins (email) values ('you@example.com');`
5. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
6. Open `/admin/login`, sign in, and click **Import default products** once to load the current catalogue.

Only emails in the `admins` table can sign in; everyone else is rejected even if they have a Supabase account. Order prices are always recalculated on the server from the product table.

## Orders, delivery and stock

- **Orders tab** (`/admin`): live list (refreshes every 20s, optional chime), one-tap status changes (Confirm -> Out for delivery -> Delivered), WhatsApp the customer, print a slip, today's sales.
- **Customers** get an order number and a tracking page at `/order/<id>` (status timeline, no sign-in needed).
- **Delivery rules** live in `src/data/business.ts` (`delivery`): minimum order, fee, free-delivery threshold and time slots. They are enforced on the server.
- **Sold-out toggle** and quick price edits are in the Products tab.
- After pulling this change, re-run `supabase/schema.sql` once (it is safe to re-run) to add the new columns.

## Live order board

`/admin/orders` (linked from the admin page) is a kanban board for running the shop day: New / Confirmed / Out for delivery / Delivered today. It shows time since the last order, the oldest order still waiting, today's sales and orders per hour, and top sellers. Cards turn amber/red when an order has waited too long (thresholds in `WAIT_LIMITS`, `src/app/admin/orderUtils.ts`). Move orders forward with one tap (7-second undo), search by name/phone/#, and optionally enable sound, desktop alerts, keep-screen-on and fullscreen for a counter display. It refreshes every 10 seconds.

## Admin panel (sidebar)

Everything in `/admin` is reached from the **left-hand sidebar**: Overview, Live orders, Order history, Products, Update prices, Sales and Shop settings. The open/closed switch is always at the top of the sidebar.

- **Open / close the shop:** sidebar switch or *Shop settings* (with a message customers see). Closing pauses new orders on the site and is enforced by the server.
- **Update prices:** `/admin/prices`. Edit many prices, use -/+ buttons, or the *% Adjust many at once* tool (with rounding), then press **Save changes** once.
- **Sales:** `/admin/sales`. Today / 7 / 30 / 90 days / this month, each compared with the previous period; trend, best sellers, categories, busiest hours and weekdays, new vs returning customers.
- **Order history:** search, filter by date/status, download CSV.

## Checkout rules

- Mobile number is **required** and must be a valid Indian mobile number (validated in the browser and on the server). Email is optional.
- Address is structured: house/flat, street, area, landmark, pincode (defaults to Hosur), plus an optional **Use my current location** pin (OpenStreetMap reverse geocoding, no key needed).
- Customers are told in the cart, the checkout and the confirmation screen that **an order is only confirmed after someone from the shop calls them.** Payment is on delivery.

## Spam protection

Honeypot field, minimum form-fill time, limits per phone (2 waiting, 3/hour, 6/day) and per hashed device, duplicate-order detection, and an admin block list (any order card, or *Shop settings*). Every new order shows how many earlier orders that number has. See `docs/PHONE_VERIFICATION.md` for the plan to add real SMS/WhatsApp verification later.

## Tests

`npm test` runs unit tests for phone/address validation, order limits and the sales calculations.

## After pulling this update

1. Re-run `supabase/schema.sql` in the Supabase SQL Editor (safe to repeat).
2. `npm install`.

## Order numbers and tracking

Every order gets a sequential **order number** (#57) shown to the customer on the confirmation screen, to staff on every order card, and searchable in the admin. Customers can follow an order any time from **Track Order** (footer): order number + the mobile number they ordered with. The longer link `/order/<id>` is unguessable and is used behind the scenes. Products have an automatic ID too (shown in the edit form).

## Speed

If the admin feels slow, read **`docs/PERFORMANCE.md`** (the main fix is setting the Vercel function region to match Supabase).

## Security

See **`docs/SECURITY.md`** for what is protected, the one-time owner checklist (two-step login, Turnstile, backups, keys) and what to do if something goes wrong. Environment variables are listed in `.env.example`. Admin extras: **Security** (two-step login, sign out of all devices) and **Activity log** in the sidebar.

## Under-development page

Set `MAINTENANCE_MODE=true` in Vercel (Settings → Environment Variables, then redeploy) to show everyone an
"under development" page (HTTP 503, hidden from search engines; API calls get a 503 too). Leave it unset in
`.env.local` and the site works normally on your machine. To preview the real site while it is hidden, set
`MAINTENANCE_BYPASS_KEY` (8+ random characters) and open `/?preview=<key>`; `/?preview=off` locks it again.
`MAINTENANCE_MESSAGE` replaces the default sentence on the page.

## Phone layout

Phones get an app-style version of the customer pages (home, shop, orders, order status, contact, more) at the
**same URLs**, with a bottom tab bar (Home, Shop, Cart, Orders, More), quick add/remove steppers and a full-screen
cart. `src/proxy.ts` picks it from the browser type and rewrites to the screens in `src/app/m/`; they share the
same database, cart and checkout as the desktop site. Every page has a "View desktop site" / "Mobile version" link
(`?view=desktop` or `?view=mobile`, remembered for 30 days; `?view=auto` forgets it). A narrow window on desktop is
switched automatically once per session. To test on a computer, use the browser's device mode (it sends a phone
browser type) or open `/?view=mobile`. Pages without a phone version (About, Blog, policies) use the normal layout.
The site can also be added to a phone's home screen (`src/app/manifest.ts`).

## Editing website content (admin)

Admin > **Website content** has four tabs: **Policies** (privacy, terms, refunds, cancellation, delivery, with a live
preview, `{{placeholders}}` for phone/fees/areas, and a history of every published version), **Business details**
(delivery fee, minimum order, free-delivery limit, time slots, areas, phone, email, address, hours, FSSAI and grievance
officer, and a notice bar), **Reviews** and **FAQ**. Everything goes live immediately. Delivery rules are also enforced
on the server when an order is placed. Before this works, run the latest `supabase/schema.sql` (adds the `testimonials`,
`faqs`, `policies` and `policy_revisions` tables and two columns on `orders`). Until content is edited, the built-in text
is shown.

Checkout requires the customer to tick a box accepting the Terms, Privacy, Delivery, Cancellation and Refund policies
(each linked and opening in a new tab). The server rejects orders without it and stores `consent_at` and the version
(`updated_at`) of each policy on the order.

## Products, offers, GST, delivery area, bills and feedback

- **Allowed quantities:** in a product's form choose which quantities customers can pick (for example 1, 2 and 5 kg). Nothing chosen = the standard steps. The server refuses any other quantity.
- **Time and date based display:** a product can be shown only on certain days, times or dates (Indian time). Either hidden completely outside the window, or shown as "Available Sun · 6:00 AM – 11:00 AM" and not orderable. Checked again on the server when an order arrives.
- **Offers:** Admin > Offers lists products with what each sold in the last 30 days (slowest first), so you can tick the slow ones and apply a percentage off with a label and an end time. A single product's offer can also be set in its form. The old price is shown crossed out.
- **GST:** Admin > Website content > Business details > GST. Rate per category (frozen products 5% by default) with an optional override and HSN code per product, and a switch for "prices already include GST". The shop must be GST registered to charge GST: ask your CA.
- **Delivery:** a fixed delivery charge (₹50), optional "free above", and a delivery radius (6 km) around the shop's map position. Customers pin their address on a map (OpenStreetMap, free) and the server checks the straight-line distance.
- **Bills:** "Print bill" on any order opens a bill laid out like the shop's own counter receipt: shop name with the financial year, address, FSSAI, GSTIN/UIN, state name and code (worked out from the GSTIN), contact, bill number (PREFIX/00057), date, time, user, items with both "Rate (Incl. of Tax)" and "Rate", totals with CGST/SGST, payment lines (Cash / Cash Tendered / Balance / Total Paid, chosen when printing), the declaration and a footer message. For an 80 mm receipt printer or A4. The details are edited in Business details > Legal details and bill.
- **Customer order page:** refreshes itself every 15 seconds while open, with a Refresh button. After delivery the customer can rate the order; Admin > Feedback lists ratings and can copy a good comment into the website reviews.

Run the latest `supabase/schema.sql` for the new product and order columns and the `order_feedback` table.
