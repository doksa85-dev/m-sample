create table public.consultations (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (char_length(phone) between 7 and 30),
  region text not null check (char_length(region) between 1 and 100),
  schedule text not null check (char_length(schedule) <= 100),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

alter table public.consultations enable row level security;
revoke all on public.consultations from anon, authenticated;
grant select, insert, update, delete on public.consultations to service_role;
create index consultations_pending on public.consultations (created_at) where notified_at is null;
