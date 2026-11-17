create function public.get_my_bid_auctions()
returns table (
  auction_id uuid,
  title text,
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
