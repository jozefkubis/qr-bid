alter table public.auctions
add column location text;

alter table public.auctions
add constraint auctions_location_required
check (
  location is not null
  and location = btrim(location)
  and char_length(location) between 2 and 120
) not valid;

drop function public.get_public_auction(uuid);

create function public.get_public_auction(p_auction_id uuid)
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

drop function public.update_owned_active_auction(uuid, text, text, bigint, bigint, timestamptz);

create function public.update_owned_active_auction(
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
      location = p_location,
      starting_price_minor = p_starting_price_minor,
      min_increment_minor = p_min_increment_minor,
      ends_at = p_ends_at,
      updated_at = statement_timestamp()
  where auctions.id = p_auction_id;

  return true;
end;
$$;

revoke all on function public.update_owned_active_auction(uuid, text, text, text, bigint, bigint, timestamptz) from public, anon, authenticated;
grant execute on function public.update_owned_active_auction(uuid, text, text, text, bigint, bigint, timestamptz) to authenticated;

drop function public.get_my_bid_auctions();

create function public.get_my_bid_auctions()
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

revoke all on function public.get_my_bid_auctions() from public, anon, authenticated;
grant execute on function public.get_my_bid_auctions() to authenticated;
