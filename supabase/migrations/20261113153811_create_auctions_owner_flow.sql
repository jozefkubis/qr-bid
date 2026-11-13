create table public.auctions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null default '',
  currency text not null default 'EUR',
  starting_price_minor bigint not null,
  min_increment_minor bigint not null,
  starts_at timestamptz not null default statement_timestamp(),
  ends_at timestamptz not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint auctions_title_length check (char_length(btrim(title)) between 3 and 120),
  constraint auctions_description_length check (char_length(description) <= 5000),
  constraint auctions_currency_eur check (currency = 'EUR'),
  constraint auctions_starting_price_range check (starting_price_minor between 1 and 9007199254740991),
  constraint auctions_min_increment_range check (min_increment_minor between 1 and 9007199254740991),
  constraint auctions_end_after_start check (ends_at > starts_at)
);

create index auctions_owner_created_at_idx
on public.auctions (owner_id, created_at desc);

alter table public.auctions enable row level security;

revoke all on table public.auctions from anon, authenticated;
grant select, insert on table public.auctions to authenticated;

create policy "auctions_select_own"
on public.auctions
for select
to authenticated
using (
  owner_id = (
    select profiles.id
    from public.profiles
    where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  )
);

create policy "auctions_insert_own"
on public.auctions
for insert
to authenticated
with check (
  owner_id = (
    select profiles.id
    from public.profiles
    where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  )
);
