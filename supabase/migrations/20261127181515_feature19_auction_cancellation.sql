alter table public.auctions
  add column cancelled_at timestamptz,
  add column cancellation_reason text,
  add constraint auctions_valid_cancellation check (
    (cancelled_at is null and cancellation_reason is null)
    or (
      cancelled_at is not null and cancellation_reason is not null
      and cancelled_at >= starts_at and cancelled_at < ends_at
      and char_length(cancellation_reason) between 1 and 500
      and cancellation_reason = btrim(cancellation_reason, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
    )
  );

-- Keep the existing creation contract while protecting lifecycle fields.
revoke insert on public.auctions from authenticated;
grant insert (owner_id, title, description, currency, starting_price_minor,
  min_increment_minor, starts_at, ends_at, created_at, updated_at, location)
on public.auctions to authenticated;

create function public.cancel_owned_auction(p_auction_id uuid, p_reason text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auction public.auctions%rowtype;
  v_now timestamptz;
  v_reason text := btrim(p_reason, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
begin
  select auctions.* into v_auction
  from public.auctions
  join public.profiles on profiles.id = auctions.owner_id
  where auctions.id = p_auction_id
    and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  for update of auctions;
  if not found then return 'unavailable'; end if;
  if v_auction.cancelled_at is not null then return 'already_cancelled'; end if;

  v_now := clock_timestamp();
  if v_now < v_auction.starts_at or v_now >= v_auction.ends_at
    or exists (select 1 from public.auction_finalizations where auction_id = p_auction_id)
  then
    return 'unavailable';
  end if;
  if v_reason is null or char_length(v_reason) not between 1 and 500 then
    return 'invalid_reason';
  end if;

  update public.auctions
  set cancelled_at = v_now, cancellation_reason = v_reason, updated_at = v_now
  where id = p_auction_id;

  perform realtime.send(
    jsonb_build_object('changed', true),
    'auction_cancelled',
    'auction:' || p_auction_id::text || ':bids',
    false
  );
  return 'cancelled';
end;
$$;

revoke all on function public.cancel_owned_auction(uuid, text) from public, anon, authenticated;
grant execute on function public.cancel_owned_auction(uuid, text) to authenticated;

-- Authorize and serialize publication or removal of photo references.
-- Physical uploads precede publication. Physical cleanup follows removal.
create function public.change_owned_auction_photos(
  p_auction_id uuid, p_owner_sub text, p_add_paths text[], p_remove_path text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auction public.auctions%rowtype;
  v_now timestamptz;
  v_added integer;
begin
  select auctions.* into v_auction
  from public.auctions
  join public.profiles on profiles.id = auctions.owner_id
  where auctions.id = p_auction_id and profiles.clerk_user_id = p_owner_sub
  for update of auctions;
  if not found then return false; end if;
  v_now := clock_timestamp();
  if v_auction.cancelled_at is not null
    or v_now < v_auction.starts_at or v_now >= v_auction.ends_at
    or exists (select 1 from public.bids where auction_id = p_auction_id)
  then
    return false;
  end if;
  if p_remove_path is not null then
    delete from public.auction_photos
    where auction_id = p_auction_id and storage_path = p_remove_path;
    return found;
  end if;
  if cardinality(p_add_paths) is null or cardinality(p_add_paths) not between 1 and 5
    or exists (
      select 1 from unnest(p_add_paths) as paths(path)
      where path is null
        or path !~ ('^' || p_auction_id::text || '/[0-9a-f-]{36}[.](jpg|png|webp)$')
    )
    or cardinality(p_add_paths) + (
      select count(*) from public.auction_photos where auction_id = p_auction_id
    ) > 5
  then
    return false;
  end if;

  insert into public.auction_photos (auction_id, storage_path, sort_order)
  select p_auction_id, paths.path, slots.sort_order
  from unnest(p_add_paths) with ordinality as paths(path, row_number)
  join (
    select sort_order, row_number() over (order by sort_order) as row_number
    from generate_series(0, 4) as available(sort_order)
    where not exists (
      select 1 from public.auction_photos as photos
      where photos.auction_id = p_auction_id and photos.sort_order = available.sort_order
    )
  ) as slots using (row_number);
  get diagnostics v_added = row_count;
  if v_added <> cardinality(p_add_paths) then
    raise exception 'Unable to allocate auction photo slots';
  end if;
  return true;
end;
$$;

revoke all on function public.change_owned_auction_photos(uuid, text, text[], text) from public, anon, authenticated;
grant execute on function public.change_owned_auction_photos(uuid, text, text[], text) to service_role;

-- Only the server can create or remove photo objects and references.
drop policy "auction_photos_insert_own_active_no_bids" on public.auction_photos;
drop policy "auction_photos_delete_own_active_no_bids" on public.auction_photos;
drop policy "auction_photo_objects_insert_own_active_no_bids" on storage.objects;
drop policy "auction_photo_objects_delete_own_active_no_bids" on storage.objects;
revoke insert, delete on public.auction_photos from authenticated;

create or replace function public.place_bid(
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
  v_cancelled_at timestamptz;
  v_now timestamptz;
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
    auctions.ends_at,
    auctions.cancelled_at
  into
    v_owner_id,
    v_starting_price_minor,
    v_min_increment_minor,
    v_starts_at,
    v_ends_at,
    v_cancelled_at
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

  if v_cancelled_at is not null then
    return query select 'cancelled'::text, null::uuid, null::bigint, v_highest, v_minimum, v_count, null::timestamptz;
    return;
  end if;

  v_now := clock_timestamp();
  if v_now < v_starts_at then
    return query select 'not_started'::text, null::uuid, null::bigint, v_highest, v_minimum, v_count, null::timestamptz;
    return;
  end if;

  if v_now >= v_ends_at then
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

  insert into public.bids (auction_id, bidder_id, amount_minor, request_id, created_at)
  values (p_auction_id, v_bidder_id, p_amount_minor, p_request_id, v_now)
  returning * into v_inserted;

  v_count := v_count + 1;
  v_highest := v_inserted.amount_minor;
  v_minimum := v_highest + v_min_increment_minor;

  return query select 'accepted'::text, v_inserted.id, v_inserted.amount_minor, v_highest, v_minimum, v_count, v_inserted.created_at;
end;
$$;

create or replace function private.start_auction_finalization(p_auction_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ends_at timestamptz;
  v_cancelled_at timestamptz;
  v_owner_id uuid;
  v_now timestamptz;
  v_event_id uuid;
begin
  select auctions.ends_at, auctions.owner_id, auctions.cancelled_at
  into v_ends_at, v_owner_id, v_cancelled_at
  from public.auctions where auctions.id = p_auction_id for update;
  if not found then return 'auction_not_found'; end if;
  if v_cancelled_at is not null then return 'cancelled'; end if;
  if exists (select 1 from public.auction_finalizations where auction_id = p_auction_id) then
    return 'already_started';
  end if;
  v_now := clock_timestamp();
  if v_now < v_ends_at then return 'not_ended'; end if;

  insert into public.auction_finalizations (auction_id, status, started_at)
  values (p_auction_id, 'awaiting_response', v_now);
  insert into public.auction_finalization_events (auction_id, event_type, occurred_at)
  values (p_auction_id, 'finalization_started', v_now);

  insert into public.auction_result_candidates (auction_id, bidder_id, rank, amount_minor, source_bid_id, created_at)
  select p_auction_id, ranked.bidder_id,
    (row_number() over (order by ranked.amount_minor desc, ranked.source_bid_id))::integer,
    ranked.amount_minor, ranked.source_bid_id, v_now
  from (
    select distinct on (bids.bidder_id)
      bids.bidder_id, bids.amount_minor, bids.id as source_bid_id
    from public.bids
    where bids.auction_id = p_auction_id
    order by bids.bidder_id, bids.amount_minor desc, bids.created_at, bids.id
  ) as ranked;

  if not exists (select 1 from public.auction_result_candidates where auction_id = p_auction_id) then
    update public.auction_finalizations
    set status = 'no_bids', closed_at = v_now, updated_at = v_now
    where auction_id = p_auction_id;
    insert into public.auction_finalization_events (auction_id, event_type, occurred_at)
    values (p_auction_id, 'no_bids', v_now) returning id into v_event_id;
    perform private.enqueue_finalization_notification(v_event_id, v_owner_id, 'no_bids', v_now);
    return 'no_bids';
  end if;

  perform private.issue_next_auction_result_offer(p_auction_id, null, v_now);
  return 'awaiting_response';
end;
$$;

create or replace function private.run_auction_finalization_cycle()
returns table (started_count integer, expired_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auction record;
  v_offer record;
  v_started integer := 0;
  v_expired integer := 0;
begin
  for v_auction in
    select auctions.id
    from public.auctions
    where auctions.ends_at <= statement_timestamp()
      and auctions.cancelled_at is null
      and not exists (
        select 1
        from public.auction_finalizations
        where auction_finalizations.auction_id = auctions.id
      )
    order by auctions.ends_at, auctions.id
    limit 100
  loop
    if private.start_auction_finalization(v_auction.id) in ('awaiting_response', 'no_bids') then
      v_started := v_started + 1;
    end if;
  end loop;

  for v_offer in
    select offers.id
    from public.auction_result_offers as offers
    where offers.status = 'active'
      and offers.expires_at <= statement_timestamp()
    order by offers.expires_at, offers.id
    limit 100
  loop
    if private.close_active_offer(v_offer.id, 'expired', null) = 'expired' then
      v_expired := v_expired + 1;
    end if;
  end loop;

  return query select v_started, v_expired;
end;
$$;

create or replace function public.add_owned_auction_note(p_auction_id uuid, p_body text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_ends_at timestamptz;
  v_cancelled_at timestamptz;
begin
  select auctions.owner_id, auctions.ends_at, auctions.cancelled_at
  into v_owner_id, v_ends_at, v_cancelled_at
  from public.auctions
  where auctions.id = p_auction_id
  for update;

  if not found
    or v_owner_id is distinct from (
      select profiles.id
      from public.profiles
      where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or v_ends_at <= clock_timestamp()
    or v_cancelled_at is not null
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

create or replace function public.update_owned_active_auction(
  p_auction_id uuid,
  p_title text,
  p_description text,
  p_location text,
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
  v_cancelled_at timestamptz;
begin
  select auctions.owner_id, auctions.ends_at, auctions.cancelled_at
  into v_owner_id, v_ends_at, v_cancelled_at
  from public.auctions
  where auctions.id = p_auction_id
  for update;

  if not found
    or v_owner_id is distinct from (
      select profiles.id
      from public.profiles
      where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or v_ends_at <= clock_timestamp()
    or v_cancelled_at is not null
    or exists (select 1 from public.bids where bids.auction_id = p_auction_id)
  then
    return false;
  end if;

  update public.auctions
  set title = p_title,
      description = p_description,
      location = p_location,
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
  v_cancelled_at timestamptz;
begin
  select auctions.owner_id, auctions.ends_at, auctions.cancelled_at
  into v_owner_id, v_ends_at, v_cancelled_at
  from public.auctions
  where auctions.id = p_auction_id
  for update;

  if not found
    or v_owner_id is distinct from (
      select profiles.id
      from public.profiles
      where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or v_ends_at <= clock_timestamp()
    or v_cancelled_at is not null
    or exists (select 1 from public.bids where bids.auction_id = p_auction_id)
  then
    return false;
  end if;

  delete from public.auctions where auctions.id = p_auction_id;
  return true;
end;
$$;

drop function public.get_public_auction(uuid);
create or replace function public.get_public_auction(p_auction_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  location text,
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
  owner_notes jsonb,
  cancelled_at timestamptz,
  cancellation_reason text
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
    auctions.location,
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
    ) as owner_notes,
    auctions.cancelled_at,
    auctions.cancellation_reason
  from public.auctions
  cross join lateral (
    select
      max(bids.amount_minor) as current_highest_minor,
      count(*)::bigint as bid_count,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'amount_minor', bids.amount_minor,
            'created_at', bids.created_at,
            'bidder_number', bidder_numbers.bidder_number
          )
          order by bids.amount_minor desc, bids.created_at desc, bids.id desc
        ) filter (where bids.id is not null),
        '[]'::jsonb
      ) as bid_history
    from public.bids
    join private.auction_bidder_numbers(auctions.id) as bidder_numbers
      on bidder_numbers.bidder_id = bids.bidder_id
    where bids.auction_id = auctions.id
  ) as bid_state
  where auctions.id = p_auction_id;
$$;
revoke all on function public.get_public_auction(uuid) from public, anon, authenticated;
grant execute on function public.get_public_auction(uuid) to anon, authenticated;

create or replace function public.get_my_bid_auctions()
returns table (
  auction_id uuid,
  title text,
  location text,
  currency text,
  ends_at timestamptz,
  photo_path text,
  current_highest_minor bigint,
  my_latest_amount_minor bigint,
  my_latest_bid_at timestamptz,
  status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    auctions.id as auction_id,
    auctions.title,
    auctions.location,
    auctions.currency,
    auctions.ends_at,
    (
      select auction_photos.storage_path
      from public.auction_photos
      where auction_photos.auction_id = auctions.id
      order by auction_photos.sort_order, auction_photos.id
      limit 1
    ) as photo_path,
    highest_bid.amount_minor as current_highest_minor,
    my_latest_bid.amount_minor as my_latest_amount_minor,
    my_latest_bid.created_at as my_latest_bid_at,
    case
      when auctions.cancelled_at is not null then 'cancelled'
      when auctions.ends_at <= statement_timestamp() then 'ended'
      when highest_bid.bidder_id = current_profile.id then 'leading'
      else 'outbid'
    end as status
  from public.profiles as current_profile
  join lateral (
    select distinct on (bids.auction_id)
      bids.auction_id,
      bids.amount_minor,
      bids.created_at
    from public.bids
    where bids.bidder_id = current_profile.id
    order by bids.auction_id, bids.created_at desc, bids.id desc
  ) as my_latest_bid on true
  join public.auctions on auctions.id = my_latest_bid.auction_id
  join lateral (
    select bids.amount_minor, bids.bidder_id
    from public.bids
    where bids.auction_id = auctions.id
    order by bids.amount_minor desc, bids.created_at desc, bids.id desc
    limit 1
  ) as highest_bid on true
  where current_profile.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  order by my_latest_bid.created_at desc, auctions.id;
$$;
