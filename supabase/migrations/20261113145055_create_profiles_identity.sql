create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  created_at timestamptz not null default now(),
  constraint profiles_clerk_user_id_not_blank
    check (length(btrim(clerk_user_id)) > 0)
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select, insert on table public.profiles to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (
  clerk_user_id = (select auth.jwt() ->> 'sub')
);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  clerk_user_id = (select auth.jwt() ->> 'sub')
);

comment on table public.profiles is
  'Internal QRBid profile mapped one-to-one to a verified Clerk subject.';

comment on column public.profiles.clerk_user_id is
  'Verified Clerk session token sub. Never accept this value from an untrusted form.';
