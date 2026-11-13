create table public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete restrict,
  bidder_id uuid not null references public.profiles(id) on delete restrict,
  amount_minor bigint not null,
  request_id uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint bids_amount_range check (amount_minor between 1 and 9007199254740991),
  constraint bids_request_id_unique unique (auction_id, bidder_id, request_id)
);

create index bids_auction_created_at_idx
on public.bids (auction_id, created_at desc, id desc);

create table public.auction_notes (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint auction_notes_body_length check (char_length(btrim(body)) between 1 and 2000)
);

create index auction_notes_auction_created_at_idx
on public.auction_notes (auction_id, created_at desc, id desc);

alter table public.bids enable row level security;
alter table public.auction_notes enable row level security;

revoke all on table public.bids from anon, authenticated;
revoke all on table public.auction_notes from anon, authenticated;

drop function public.get_public_auction(uuid);

create function public.get_public_auction(p_auction_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  currency text,
  starting_price_minor bigint,
  min_increment_minor bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  photo_paths text[],
  current_highest_minor bigint,
  minimum_next_bid_minor bigint,
  bid_count bigint,
  bid_history jsonb,
  owner_notes jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    auctions.id,
    auctions.title,
    auctions.description,
    auctions.currency,
    auctions.starting_price_minor,
    auctions.min_increment_minor,
    auctions.starts_at,
    auctions.ends_at,
    coalesce(
      (
        select array_agg(auction_photos.storage_path order by auction_photos.sort_order)
        from public.auction_photos
        where auction_photos.auction_id = auctions.id
      ),
      array[]::text[]
    ) as photo_paths,
    bid_state.current_highest_minor,
    coalesce(
      bid_state.current_highest_minor + auctions.min_increment_minor,
      auctions.starting_price_minor
    ) as minimum_next_bid_minor,
    bid_state.bid_count,
    bid_state.bid_history,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'body', auction_notes.body,
            'created_at', auction_notes.created_at
          )
          order by auction_notes.created_at desc, auction_notes.id desc
        )
        from public.auction_notes
        where auction_notes.auction_id = auctions.id
      ),
      '[]'::jsonb
    ) as owner_notes
  from public.auctions
  cross join lateral (
    select
      max(bids.amount_minor) as current_highest_minor,
      count(*)::bigint as bid_count,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'amount_minor', bids.amount_minor,
            'created_at', bids.created_at
          )
          order by bids.created_at desc, bids.id desc
        ) filter (where bids.id is not null),
        '[]'::jsonb
      ) as bid_history
    from public.bids
    where bids.auction_id = auctions.id
  ) as bid_state
  where auctions.id = p_auction_id;
$$;

revoke all on function public.get_public_auction(uuid) from public, anon, authenticated;
grant execute on function public.get_public_auction(uuid) to anon, authenticated;

create function public.place_bid(
  p_auction_id uuid,
  p_amount_minor bigint,
  p_request_id uuid
)
returns table (
  status text,
  bid_id uuid,
  accepted_amount_minor bigint,
  current_highest_minor bigint,
  minimum_next_bid_minor bigint,
  bid_count bigint,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bidder_id uuid;
  v_owner_id uuid;
  v_starting_price_minor bigint;
  v_min_increment_minor bigint;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_existing public.bids%rowtype;
  v_highest bigint;
  v_minimum bigint;
  v_count bigint;
  v_inserted public.bids%rowtype;
begin
  select profiles.id
  into v_bidder_id
  from public.profiles
  where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub');

  if v_bidder_id is null then
    return query select 'profile_missing'::text, null::uuid, null::bigint, null::bigint, null::bigint, 0::bigint, null::timestamptz;
    return;
  end if;

  select
    auctions.owner_id,
    auctions.starting_price_minor,
    auctions.min_increment_minor,
    auctions.starts_at,
    auctions.ends_at
  into
    v_owner_id,
    v_starting_price_minor,
    v_min_increment_minor,
    v_starts_at,
    v_ends_at
  from public.auctions
  where auctions.id = p_auction_id
  for update;

  if not found then
    return query select 'auction_not_found'::text, null::uuid, null::bigint, null::bigint, null::bigint, 0::bigint, null::timestamptz;
    return;
  end if;

  select bids.*
  into v_existing
  from public.bids
  where bids.auction_id = p_auction_id
    and bids.bidder_id = v_bidder_id
    and bids.request_id = p_request_id;

  select max(bids.amount_minor), count(*)::bigint
  into v_highest, v_count
  from public.bids
  where bids.auction_id = p_auction_id;
  v_minimum := coalesce(v_highest + v_min_increment_minor, v_starting_price_minor);

  if found and v_existing.id is not null then
    if v_existing.amount_minor <> p_amount_minor then
      return query select 'request_conflict'::text, v_existing.id, v_existing.amount_minor, v_highest, v_minimum, v_count, v_existing.created_at;
    else
      return query select 'replayed'::text, v_existing.id, v_existing.amount_minor, v_highest, v_minimum, v_count, v_existing.created_at;
    end if;
    return;
  end if;

  if v_owner_id = v_bidder_id then
    return query select 'own_auction'::text, null::uuid, null::bigint, v_highest, v_minimum, v_count, null::timestamptz;
    return;
  end if;

  if statement_timestamp() < v_starts_at then
    return query select 'not_started'::text, null::uuid, null::bigint, v_highest, v_minimum, v_count, null::timestamptz;
    return;
  end if;

  if statement_timestamp() >= v_ends_at then
    return query select 'ended'::text, null::uuid, null::bigint, v_highest, v_minimum, v_count, null::timestamptz;
    return;
  end if;

  if p_amount_minor is null or p_amount_minor < 1 or p_amount_minor > 9007199254740991 then
    return query select 'invalid_amount'::text, null::uuid, null::bigint, v_highest, v_minimum, v_count, null::timestamptz;
    return;
  end if;

  if p_amount_minor < v_minimum then
    return query select 'bid_too_low'::text, null::uuid, null::bigint, v_highest, v_minimum, v_count, null::timestamptz;
    return;
  end if;

  insert into public.bids (auction_id, bidder_id, amount_minor, request_id)
  values (p_auction_id, v_bidder_id, p_amount_minor, p_request_id)
  returning * into v_inserted;

  v_count := v_count + 1;
  v_highest := v_inserted.amount_minor;
  v_minimum := v_highest + v_min_increment_minor;

  return query select 'accepted'::text, v_inserted.id, v_inserted.amount_minor, v_highest, v_minimum, v_count, v_inserted.created_at;
end;
$$;

revoke all on function public.place_bid(uuid, bigint, uuid) from public, anon, authenticated;
grant execute on function public.place_bid(uuid, bigint, uuid) to authenticated;

create function public.get_owned_bid_summaries()
returns table (
  auction_id uuid,
  current_highest_minor bigint,
  bid_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    auctions.id,
    max(bids.amount_minor),
    count(bids.id)::bigint
  from public.auctions
  join public.profiles on profiles.id = auctions.owner_id
  left join public.bids on bids.auction_id = auctions.id
  where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  group by auctions.id;
$$;

revoke all on function public.get_owned_bid_summaries() from public, anon, authenticated;
grant execute on function public.get_owned_bid_summaries() to authenticated;

create function public.add_owned_auction_note(p_auction_id uuid, p_body text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_ends_at timestamptz;
begin
  select auctions.owner_id, auctions.ends_at
  into v_owner_id, v_ends_at
  from public.auctions
  where auctions.id = p_auction_id
  for update;

  if not found
    or v_owner_id is distinct from (
      select profiles.id
      from public.profiles
      where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or v_ends_at <= statement_timestamp()
    or not exists (select 1 from public.bids where bids.auction_id = p_auction_id)
    or char_length(btrim(p_body)) not between 1 and 2000
  then
    return false;
  end if;

  insert into public.auction_notes (auction_id, body)
  values (p_auction_id, btrim(p_body));
  return true;
end;
$$;

revoke all on function public.add_owned_auction_note(uuid, text) from public, anon, authenticated;
grant execute on function public.add_owned_auction_note(uuid, text) to authenticated;

create or replace function public.update_owned_active_auction(
  p_auction_id uuid,
  p_title text,
  p_description text,
  p_starting_price_minor bigint,
  p_min_increment_minor bigint,
  p_ends_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_ends_at timestamptz;
begin
  select auctions.owner_id, auctions.ends_at
  into v_owner_id, v_ends_at
  from public.auctions
  where auctions.id = p_auction_id
  for update;

  if not found
    or v_owner_id is distinct from (
      select profiles.id
      from public.profiles
      where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or v_ends_at <= statement_timestamp()
    or exists (select 1 from public.bids where bids.auction_id = p_auction_id)
  then
    return false;
  end if;

  update public.auctions
  set title = p_title,
      description = p_description,
      starting_price_minor = p_starting_price_minor,
      min_increment_minor = p_min_increment_minor,
      ends_at = p_ends_at,
      updated_at = statement_timestamp()
  where auctions.id = p_auction_id;

  return true;
end;
$$;

create or replace function public.delete_owned_active_auction(p_auction_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_ends_at timestamptz;
begin
  select auctions.owner_id, auctions.ends_at
  into v_owner_id, v_ends_at
  from public.auctions
  where auctions.id = p_auction_id
  for update;

  if not found
    or v_owner_id is distinct from (
      select profiles.id
      from public.profiles
      where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or v_ends_at <= statement_timestamp()
    or exists (select 1 from public.bids where bids.auction_id = p_auction_id)
  then
    return false;
  end if;

  delete from public.auctions where auctions.id = p_auction_id;
  return true;
end;
$$;

drop policy "auction_photos_insert_own_active" on public.auction_photos;
drop policy "auction_photos_delete_own_active" on public.auction_photos;
drop policy "auction_photo_objects_insert_own_active" on storage.objects;
drop policy "auction_photo_objects_delete_own_active" on storage.objects;

create policy "auction_photos_insert_own_active_no_bids"
on public.auction_photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.auctions
    join public.profiles on profiles.id = auctions.owner_id
    where auctions.id = auction_photos.auction_id
      and auctions.ends_at > statement_timestamp()
      and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
      and not exists (select 1 from public.bids where bids.auction_id = auctions.id)
  )
);

create policy "auction_photos_delete_own_active_no_bids"
on public.auction_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.auctions
    join public.profiles on profiles.id = auctions.owner_id
    where auctions.id = auction_photos.auction_id
      and auctions.ends_at > statement_timestamp()
      and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
      and not exists (select 1 from public.bids where bids.auction_id = auctions.id)
  )
);

create policy "auction_photo_objects_insert_own_active_no_bids"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'auction-photos'
  and exists (
    select 1
    from public.auctions
    join public.profiles on profiles.id = auctions.owner_id
    where auctions.id::text = (storage.foldername(name))[1]
      and auctions.ends_at > statement_timestamp()
      and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
      and not exists (select 1 from public.bids where bids.auction_id = auctions.id)
  )
);

create policy "auction_photo_objects_delete_own_active_no_bids"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'auction-photos'
  and exists (
    select 1
    from public.auctions
    join public.profiles on profiles.id = auctions.owner_id
    where auctions.id::text = (storage.foldername(name))[1]
      and auctions.ends_at > statement_timestamp()
      and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
      and not exists (select 1 from public.bids where bids.auction_id = auctions.id)
  )
);
