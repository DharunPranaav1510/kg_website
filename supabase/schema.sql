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
