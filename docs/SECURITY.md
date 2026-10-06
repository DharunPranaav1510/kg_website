# Security guide

What protects the shop, what the owner must do, and what to do if something goes wrong.

## What the code already does

| Area | Protection |
|---|---|
| Database | Every table has row-level security with no public policies. Only our server (secret key) can read or write. |
| Admin login | Password **and** the email must be on the `admins` list. Optional two-step login (authenticator app). Lock-out after repeated wrong passwords or codes (shared across all servers). Sessions end server-side on logout; "Sign out of all devices" ends every session. |
| Admin requests | Cookies are `HttpOnly`, `SameSite=Strict`, `Secure` in production. Every admin API also rejects requests whose `Origin` is another site. |
| Orders | Prices, stock, delivery fees and slots are recalculated on the server. Phone numbers are validated. Honeypot, minimum fill time, per-phone and per-device limits, duplicate detection, block list. Optional Cloudflare Turnstile. |
| Uploads | Only real JPEG / PNG / WebP files (checked by their bytes, SVG refused), max 4 MB. Product photos can only come from `/images` or our own storage bucket. |
| Browser | Security headers on every page: Content-Security-Policy, no framing (clickjacking), no MIME sniffing, strict referrer policy, location only for our own pages, HSTS. Admin pages, APIs and order pages are never cached. |
| Accountability | `Admin > Activity log` records sign-ins, failed sign-ins, price/stock changes, order changes, shop open/close, blocks. |
| Dependencies | `npm audit --omit=dev` reports 0 problems. Dependabot opens pull requests for updates (`.github/dependabot.yml`). |

## One-time setup checklist (owner)

1. **Run `supabase/schema.sql`** again (adds `rate_events` and `admin_audit`).
2. Supabase → Authentication → Sign In / Providers: **turn off "Allow new users to sign up"**.
3. Admin account: a long, unique password (use a password manager).
4. Admin → **Security** → *Set up two-step login*. Once everyone has done it, set `ADMIN_REQUIRE_MFA=true` in Vercel to make it compulsory.
5. Vercel environment variables (see `.env.example`): `IP_HASH_SALT` (long random text), and the Supabase keys. **Never** put the secret key in a variable starting with `NEXT_PUBLIC_`.
6. Optional but recommended once the site is public: create a free **Cloudflare Turnstile** widget, then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. Checkout and the contact form will start asking for the check.
7. GitHub → Settings → Code security: enable **Dependabot alerts** and **secret scanning**.
8. Supabase → Project Settings → check what **backups** your plan has. Download orders now and then (Admin → Order history → *Download CSV*).

## If something goes wrong

| Situation | Do this |
|---|---|
| Lost phone with the authenticator app | Supabase → Authentication → Users → your user → delete the authenticator factor, then sign in and set it up again. |
| Suspect someone else used the admin | Admin → Security → *Sign out of all devices*, change the password in Supabase, check Admin → Activity log. |
| The Supabase secret key was shared or leaked | Supabase → Project Settings → API → create a new secret key, update `SUPABASE_SERVICE_ROLE_KEY` in Vercel, redeploy, delete the old key. |
| Junk or fake orders keep coming | Block the numbers (order card → *Block number*). Turn on Turnstile (step 6). Consider the phone verification plan in `docs/PHONE_VERIFICATION.md`. |
| Need to delete a customer's data on request | Run in the Supabase SQL Editor (replace the number): `delete from public.orders where phone = '+919876543210';` and `delete from public.enquiries where phone = '+919876543210';` |

## Housekeeping you may want (SQL Editor)

Delete orders older than three years (matches the privacy policy):

```sql
delete from public.orders where created_at < now() - interval '3 years';
delete from public.enquiries where created_at < now() - interval '3 years';
delete from public.admin_audit where created_at < now() - interval '1 year';
```

## Known limits (be aware)

- The Content-Security-Policy has to allow inline scripts because Next.js needs them to start pages. It still blocks scripts from other websites, framing, plugins and unexpected form targets.
- Without real phone verification, someone can still type a number that is not theirs. The call-to-confirm rule and the limits keep the damage small.
- Login lock-out is per email and per device (5 wrong passwords / 15 minutes). Someone who knows an admin's email could use that to briefly block the real admin from signing in; waiting 15 minutes clears it.
- Remaining `npm audit` items are in development tools only (they never run on the live site).

## Editable content

- Policy text is rendered by a small formatter (`src/components/Markdown.tsx`) that never outputs raw HTML and only allows
  links starting with `/`, `https://`, `mailto:` or `tel:`. Reviews, FAQ and business details are validated on the server
  (`src/lib/content-schema.ts`) and shown as plain text. Review photos must be uploaded through the admin uploader.
- All content routes (`/api/admin/content`, `/policies`, `/business`) need an admin session and an allowed Origin, and are
  written to the activity log. Every saved policy version is kept in `policy_revisions`.
- Orders store `consent_at` and `policy_versions` as proof of what the customer accepted.

## Admin invitations

- The link holds a 256-bit random token; only its SHA-256 hash is stored. The 6-digit code is stored as an HMAC bound to that invitation, is emailed only to the invited address, expires in 10 minutes, allows 5 wrong tries, and is only sent when the invited person presses the button (so mail scanners that open links cannot trigger it).
- Accepting claims the invitation with a single conditional update, so it can be used once even if two requests race. If creating the login fails the invitation is given back.
- The public routes (`/api/admin/invite/*`) check the Origin, are rate limited per device and per invitation, and give one generic answer for unknown, expired, cancelled or used links.
- Emailed links use `SITE_URL`, not the Host header, so a forged header cannot redirect an invitation.
- Removing an admin deletes their `admins` row and their login. Invites, joins and removals are in the activity log.
