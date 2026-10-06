-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  address text not null,
  note text,
  items jsonb not null,
  total numeric(10, 2) not null,
  status text not null default 'new'
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text not null,
  message text not null
);

-- Lock the tables down: with RLS on and no policies, the public anon key
-- cannot read or write. The server uses the service-role key, which bypasses RLS.
alter table public.orders enable row level security;
alter table public.enquiries enable row level security;

-- ---------------------------------------------------------------------------
-- Admin + product management
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  category text not null,
  price_per_kg numeric(10, 2) not null check (price_per_kg >= 0),
  image text not null default '',
  badge text,
  description text not null default '',
  is_egg boolean not null default false,
  featured boolean not null default false,
  active boolean not null default true
);

-- Only emails listed here can use the admin panel.
create table if not exists public.admins (
  email text primary key
);

alter table public.products enable row level security;
alter table public.admins enable row level security;

-- Public bucket for product photos (uploads happen server-side only).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- After creating your admin user in Supabase (Authentication -> Users), add
-- their email here:
-- insert into public.admins (email) values ('you@example.com');

-- ---------------------------------------------------------------------------
-- Order tracking, delivery slots, sold-out toggle (safe to re-run)
-- ---------------------------------------------------------------------------

alter table public.products add column if not exists in_stock boolean not null default true;

alter table public.orders add column if not exists order_number bigint generated always as identity;
alter table public.orders add column if not exists delivery_fee numeric(10, 2) not null default 0;
alter table public.orders add column if not exists slot text;

-- ---------------------------------------------------------------------------
-- Shop open/closed, structured addresses, spam protection (safe to re-run)
-- ---------------------------------------------------------------------------

-- Key/value settings edited from the admin panel (e.g. key 'shop').
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Phone numbers that may not place orders.
create table if not exists public.blocked_phones (
  phone text primary key,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists email text;
alter table public.orders add column if not exists area text;
alter table public.orders add column if not exists landmark text;
alter table public.orders add column if not exists pincode text;
alter table public.orders add column if not exists lat double precision;
alter table public.orders add column if not exists lng double precision;
alter table public.orders add column if not exists phone_verified boolean not null default false;
alter table public.orders add column if not exists ip_hash text;

alter table public.enquiries add column if not exists ip_hash text;

create index if not exists orders_phone_created_idx on public.orders (phone, created_at desc);
create index if not exists orders_ip_created_idx on public.orders (ip_hash, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists enquiries_ip_created_idx on public.enquiries (ip_hash, created_at desc);

alter table public.settings enable row level security;
alter table public.blocked_phones enable row level security;
alter table public.enquiries alter column email drop not null;

-- ---------------------------------------------------------------------------
-- Security: shared rate limiting + admin activity log (safe to re-run)
-- ---------------------------------------------------------------------------

-- One row per counted event (failed admin logins, order lookups, order attempts).
create table if not exists public.rate_events (
  id bigint generated always as identity primary key,
  kind text not null,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup_idx on public.rate_events (kind, key, created_at desc);

-- Who changed what in the admin panel.
create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  admin_email text not null,
  action text not null,
  target text,
  detail jsonb
);
create index if not exists admin_audit_created_idx on public.admin_audit (created_at desc);

alter table public.rate_events enable row level security;
alter table public.admin_audit enable row level security;

-- ---------------------------------------------------------------------------
-- Editable website content: testimonials, FAQ, policies (safe to re-run)
-- Business details live in public.settings under the key 'business'.
-- ---------------------------------------------------------------------------

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  location text,
  image text,
  rating int not null default 5 check (rating between 1 and 5),
  quote text not null,
  product text,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.policies (
  slug text primary key,
  title text not null,
  subtitle text,
  body text not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Every saved version of a policy, so we can show what a customer agreed to.
create table if not exists public.policy_revisions (
  id bigint generated always as identity primary key,
  slug text not null,
  title text not null,
  subtitle text,
  body text not null,
  saved_at timestamptz not null default now(),
  saved_by text
);
create index if not exists policy_revisions_slug_idx on public.policy_revisions (slug, saved_at desc);

-- Proof that the customer accepted the policies when ordering.
alter table public.orders add column if not exists consent_at timestamptz;
alter table public.orders add column if not exists policy_versions jsonb;

alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.policies enable row level security;
alter table public.policy_revisions enable row level security;

-- ---------------------------------------------------------------------------
-- Allowed weights, GST, offers, time-based availability, bills, feedback (safe to re-run)
-- ---------------------------------------------------------------------------

alter table public.products add column if not exists allowed_weights numeric[];
alter table public.products add column if not exists gst_rate numeric(5, 2);
alter table public.products add column if not exists hsn text;
alter table public.products add column if not exists offer_price numeric(10, 2);
alter table public.products add column if not exists offer_label text;
alter table public.products add column if not exists offer_from timestamptz;
alter table public.products add column if not exists offer_to timestamptz;
alter table public.products add column if not exists schedule jsonb;

alter table public.orders add column if not exists subtotal numeric(10, 2);
alter table public.orders add column if not exists gst_total numeric(10, 2) not null default 0;
alter table public.orders add column if not exists gst_inclusive boolean not null default false;
alter table public.orders add column if not exists distance_km numeric(6, 2);

-- One feedback entry per order, written by the customer from their order page.
create table if not exists public.order_feedback (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists order_feedback_created_idx on public.order_feedback (created_at desc);
alter table public.order_feedback enable row level security;

-- ---------------------------------------------------------------------------
-- Inviting new admins by email (safe to re-run)
-- ---------------------------------------------------------------------------

alter table public.admins add column if not exists added_by text;
alter table public.admins add column if not exists added_at timestamptz not null default now();

-- One row per invitation. Only hashes are stored: the link token and the emailed code cannot be read back.
create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  otp_hash text,
  otp_expires_at timestamptz,
  otp_attempts int not null default 0,
  otp_sends int not null default 0,
  last_otp_sent_at timestamptz,
  expires_at timestamptz not null,
  invited_by text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists admin_invites_email_idx on public.admin_invites (lower(email));
alter table public.admin_invites enable row level security;
