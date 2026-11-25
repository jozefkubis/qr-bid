create function private.auction_bidder_numbers(p_auction_id uuid)
returns table (bidder_id uuid, bidder_number bigint)
language sql
stable
set search_path = ''
as $$
  -- The locked bid transaction accepts strictly increasing amounts.
  -- Amounts preserve acceptance order even when request timestamps tie or overlap.
  select bids.bidder_id, row_number() over (order by min(bids.amount_minor), bids.bidder_id)
  from public.bids
  where bids.auction_id = p_auction_id
  group by bids.bidder_id;
$$;

revoke all on function private.auction_bidder_numbers(uuid) from public, anon, authenticated;

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

create function public.get_my_auction_bidder_number(p_auction_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select bidder_numbers.bidder_number
  from private.auction_bidder_numbers(p_auction_id) as bidder_numbers
  join public.profiles on profiles.id = bidder_numbers.bidder_id
  where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub');
$$;

revoke all on function public.get_my_auction_bidder_number(uuid) from public, anon, authenticated;
grant execute on function public.get_my_auction_bidder_number(uuid) to authenticated;
