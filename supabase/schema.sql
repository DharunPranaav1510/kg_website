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
