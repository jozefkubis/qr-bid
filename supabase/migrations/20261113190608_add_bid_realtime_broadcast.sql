create function public.broadcast_auction_bid_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('changed', true),
    'bid_changed',
    'auction:' || new.auction_id::text || ':bids',
    false
  );
  return null;
end;
$$;

revoke all on function public.broadcast_auction_bid_change() from public, anon, authenticated;

create trigger broadcast_auction_bid_after_insert
after insert on public.bids
for each row
execute function public.broadcast_auction_bid_change();
