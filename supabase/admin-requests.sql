-- Admin access requests: people ask for admin access from the sign-in page, and only the owner
-- (dpranaav@gmail.com) can approve or reject them in Admin > Admins. Run once in the Supabase SQL editor (safe to run again).
create table if not exists public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  name text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_at timestamptz,
  decided_by text,
  ip_hash text
);
-- One request per email (a rejected one can be asked again, which reopens the same row).
create unique index if not exists admin_requests_email_key on public.admin_requests (lower(email));
create index if not exists admin_requests_status_idx on public.admin_requests (status, created_at desc);

-- Locked down like the other tables: only the server (service role) can read or write.
alter table public.admin_requests enable row level security;
