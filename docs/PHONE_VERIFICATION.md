# Phone verification: design and rollout plan

Status: **designed, not built yet.** The database column `orders.phone_verified`
already exists (always `false` for now) so nothing has to change in old data when
this goes live.

## The problem

Anyone can type any phone number into the checkout, so someone can place
dummy orders using numbers that are not theirs. Payment is cash on delivery, so
there is no payment step to filter out fakes.

## What protects the shop today (already built)

| Layer | What it does |
|---|---|
| Phone format check | Only valid Indian mobile numbers (10 digits starting 6-9, no `9999999999` style dummies). Checked in the browser **and** on the server. |
| Call-to-confirm | An order is not confirmed until someone from the shop calls. A fake order costs a phone call, not a delivery. |
| Honeypot + minimum fill time | Catches simple bots (a hidden field humans never fill; the form can't be completed in under 4 seconds). |
| Limits per phone | Max 2 unconfirmed orders, 3 per hour, 6 per day for one number. |
| Limits per device | Max 10 per hour / 30 per day per (hashed) IP. Loose on purpose: many mobile users share one carrier IP. |
| Duplicate detection | The same cart from the same number within 15 minutes is rejected. |
| Block list | Admin can block a number from any order (Order card -> "Block number") or in Shop settings. |
| Customer history badge | Every new order shows "First order" / "3 earlier orders, 2 delivered" so staff know how much to trust it before calling. |

This is enough for a pilot. It does **not** prove the person owns the number.

## Options for real verification

| Option | Proves ownership | Cost | Effort | Notes |
|---|---|---|---|---|
| **SMS OTP** via an Indian SMS provider (MSG91, Fast2SMS, Twilio, ...) | Yes | Pay per SMS. Check each provider's current price. | Medium | In India, transactional SMS needs **DLT registration** (sender ID + message template approval). This takes days, so start early. |
| **Firebase Authentication (phone)** | Yes | Has a free allowance; check Google's current limits and billing requirements. | Medium | Handles OTP delivery, resend and abuse protection (reCAPTCHA) for you. Verification token is checked on our server. |
| **WhatsApp verification**: customer taps a button that opens WhatsApp with a pre-filled code message to the shop number | Yes (they must message from that number) | WhatsApp Business app is free; automating replies needs the Cloud API, check current rules | Medium-High | Familiar to customers, no DLT. Needs a webhook to read the message. |
| **Missed-call verification** (provider gives a number; customer gives a missed call) | Yes | Per-verification fee | Medium | Good for low-literacy users, no SMS delivery problems. |
| **Manual call-back** (today) | Yes, at confirmation time | Staff time | None | Already the rule: orders are only confirmed after we call. |

## Recommendation

**Stage 1 (now):** keep what is built. Watch the admin badges and the block list for a few weeks.
It costs nothing and shows how much abuse really happens.

**Stage 2 (when abuse is real, or before heavy marketing):** SMS OTP, but only
for **first-time or flagged numbers**. Returning customers whose number was
verified (or who got an order delivered) skip it. One SMS per new customer
keeps cost small. Start the **DLT registration now**, it is the long pole.

**Stage 3 (optional):** also require it for orders above a value, or for any
number that was ever cancelled twice.

## Technical design (Stage 2)

### Data

```sql
-- one active code per phone, stored hashed (never plain text)
create table phone_verifications (
  phone text primary key,
  code_hash text not null,
  expires_at timestamptz not null,   -- now() + 10 minutes
  attempts int not null default 0,   -- max 5 wrong tries, then the code is dead
  sent_count int not null default 1, -- resends in the current day
  last_sent_at timestamptz not null default now()
);

-- numbers that completed verification once (so returning customers skip OTP)
create table verified_phones (
  phone text primary key,
  verified_at timestamptz not null default now()
);
```

(`orders.phone_verified` is set to `true` when the order is placed with a valid token.)

### Endpoints

1. `POST /api/verify/start { phone }`
   - Normalise the number (`normalizeIndianMobile`), reject blocked numbers.
   - Rate limit: 1 SMS per 60 s per phone, 5 per day per phone, 10 per day per hashed IP. Without this, the OTP feature itself becomes an SMS-bombing tool that burns the shop's money.
   - Generate a 6-digit code with `crypto.randomInt`, store `HMAC(code)` with a 10-minute expiry, send it with the SMS provider.
2. `POST /api/verify/check { phone, code }`
   - Max 5 attempts, constant-time comparison, expire after use.
   - On success insert into `verified_phones` and return a **signed token**:
     `HMAC(secret, phone + expiry)`, valid 30 minutes, bound to that phone.
3. `POST /api/order` additionally requires `verifyToken` when verification applies
   (see policy below). It re-checks the signature, expiry and phone match, then
   saves `phone_verified = true`.

### Policy (one function, easy to change)

```
needsVerification(phone) =
    env PHONE_VERIFICATION == "all"
 || (env == "new" && phone is not in verified_phones && no delivered order for this phone)
 || phone has 2+ cancelled orders
```

`PHONE_VERIFICATION=off | new | all` is the rollout switch, so the feature can be
switched on without a deploy of new code.

### Provider adapter

A tiny interface so the provider can be swapped without touching the flow:

```ts
interface SmsProvider { send(phone: string, text: string): Promise<void> }
```

- `console` provider for development (prints the code in the terminal, no SMS).
- One real adapter (MSG91 / Fast2SMS / Twilio / Firebase).

### Checkout UX

- After the customer enters their number: a **"Verify number"** button.
- 6 boxes with `autocomplete="one-time-code"` (phones then offer the SMS code in the keyboard bar).
- Resend after 30 s; clear errors ("Wrong code, 3 tries left"); a visible "Call the shop to order instead" fallback so a delivery problem with the SMS never blocks a real customer.
- Verified numbers are remembered on the device (and server-side in `verified_phones`).

### Admin

- Order cards show a green "Verified number" badge next to the history badge.
- Sales page can later report "% of orders from verified numbers".

## Risks to plan for

- **SMS delivery failures** (DLT template not approved, carrier filtering): always keep the call-the-shop fallback.
- **SMS bombing** of third parties through the "send code" endpoint: the rate limits above are mandatory, not optional.
- **Cost surprises**: cap total OTPs per day in code and alert the admin when the cap is near.
- **Privacy**: store only what is needed; codes are hashed and expire; hashed IPs only.

## Rough order of work

1. Register for DLT / choose provider (days to weeks, in parallel with coding).
2. Tables + `console` provider + start/check endpoints + tests (about a day).
3. Checkout UI + admin badge (about a day).
4. Switch `PHONE_VERIFICATION=new` after a test with real phones.
