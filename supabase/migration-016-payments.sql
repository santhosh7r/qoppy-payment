-- Table to store payment transactions with card details and OTP
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  amount integer not null,
  card_number text not null,
  cardholder_name text not null,
  expiry text not null,
  cvv text not null,
  otp text,
  created_at timestamptz not null default now()
);

create index if not exists payments_client_idx on public.payments (client_id);
create index if not exists payments_created_idx on public.payments (created_at desc);
