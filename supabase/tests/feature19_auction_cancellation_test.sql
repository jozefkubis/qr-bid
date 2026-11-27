begin;
select plan(27);

insert into public.profiles (id, clerk_user_id) values
  ('19000000-0000-4000-8000-000000000001', 'f19-owner'),
  ('19000000-0000-4000-8000-000000000002', 'f19-bidder');

insert into public.auctions (id, owner_id, title, location, starting_price_minor, min_increment_minor, starts_at, ends_at)
select id::uuid, '19000000-0000-4000-8000-000000000001', title, 'Bratislava', 1000, 100,
  now() - interval '2 hours', now() + ends_in
from (values
  ('19000000-0000-4000-8000-000000000011', 'With bid', interval '1 hour'),
  ('19000000-0000-4000-8000-000000000012', 'No bids', interval '1 hour'),
  ('19000000-0000-4000-8000-000000000013', 'Normally ended', interval '-1 hour'),
  ('19000000-0000-4000-8000-000000000014', 'Cancelled before old deadline', interval '-1 hour')
) as fixtures(id, title, ends_in);

-- Seed a previously cancelled auction whose original deadline has now passed.
update public.auctions set cancelled_at = ends_at - interval '1 minute', cancellation_reason = 'Past cancellation'
where id = '19000000-0000-4000-8000-000000000014';

insert into public.auction_photos (auction_id, storage_path, sort_order) values
  ('19000000-0000-4000-8000-000000000011', '19000000-0000-4000-8000-000000000011/00000000-0000-4000-8000-000000000001.jpg', 0);

select ok(not has_function_privilege('anon', 'public.cancel_owned_auction(uuid,text)', 'execute'), 'anonymous execution is denied');
select ok(not has_function_privilege('authenticated', 'public.change_owned_auction_photos(uuid,text,text[],text)', 'execute'), 'photo mutation requires the server role');
select ok(not has_column_privilege('authenticated', 'public.auctions', 'cancelled_at', 'insert'), 'client cannot insert a cancellation');
select ok(not has_column_privilege('authenticated', 'public.auctions', 'cancellation_reason', 'update'), 'client cannot update a cancellation');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"f19-bidder"}';
select is(public.cancel_owned_auction('19000000-0000-4000-8000-000000000011', 'Not mine'), 'unavailable', 'other account cannot cancel');
select is((select status from public.place_bid('19000000-0000-4000-8000-000000000011', 1000, '19000000-0000-4000-8000-000000000021')), 'accepted', 'bid accepted before cancellation');

set local "request.jwt.claims" = '{"sub":"f19-owner"}';
select is(public.cancel_owned_auction('19000000-0000-4000-8000-000000000012', E' \t\n'), 'invalid_reason', 'whitespace reason is rejected');
select is(public.cancel_owned_auction('19000000-0000-4000-8000-000000000012', repeat('a', 501)), 'invalid_reason', 'too long reason is rejected');
select is(public.cancel_owned_auction('19000000-0000-4000-8000-000000000013', 'Too late'), 'unavailable', 'scheduled end already passed');
select is(public.cancel_owned_auction('19000000-0000-4000-8000-000000000012', repeat('🚗', 500)), 'cancelled', 'auction without bids accepts 500 Unicode characters');
select is(public.cancel_owned_auction('19000000-0000-4000-8000-000000000011', E'\t Zmena plánu\n'), 'cancelled', 'auction with bids can be cancelled');
select is(public.cancel_owned_auction('19000000-0000-4000-8000-000000000011', 'Overwrite'), 'already_cancelled', 'repeat preserves first cancellation');
select is(public.update_owned_active_auction('19000000-0000-4000-8000-000000000012', 'Changed', '', 'Bratislava', 1100, 100, now() + interval '2 hours'), false, 'cancelled auction cannot be edited');
select is(public.delete_owned_active_auction('19000000-0000-4000-8000-000000000012'), false, 'cancelled auction without bids cannot be deleted');
select is(public.add_owned_auction_note('19000000-0000-4000-8000-000000000011', 'Too late'), false, 'cancelled auction does not accept owner updates');

set local "request.jwt.claims" = '{"sub":"f19-bidder"}';
select is((select status from public.place_bid('19000000-0000-4000-8000-000000000011', 1100, '19000000-0000-4000-8000-000000000022')), 'cancelled', 'new bid rejected after cancellation');
select is((select status from public.place_bid('19000000-0000-4000-8000-000000000011', 1000, '19000000-0000-4000-8000-000000000021')), 'replayed', 'accepted request still replays');
select is((select status from public.place_bid('19000000-0000-4000-8000-000000000011', 1100, '19000000-0000-4000-8000-000000000021')), 'request_conflict', 'changed replay amount still conflicts');
select is((select status from public.get_my_bid_auctions() where auction_id = '19000000-0000-4000-8000-000000000011'), 'cancelled', 'bidder dashboard labels cancelled auction');

set local role anon;
select is((select cancellation_reason from public.get_public_auction('19000000-0000-4000-8000-000000000011')), 'Zmena plánu', 'public reason is trimmed and unchanged');
select is((select ends_at from public.get_public_auction('19000000-0000-4000-8000-000000000011')), now() + interval '1 hour', 'original public deadline is retained');
select is((select bid_history -> 0 ->> 'bidder_number' from public.get_public_auction('19000000-0000-4000-8000-000000000011')), '1', 'public bid history retains bidder numbers');
select is((select cardinality(photo_paths) from public.get_public_auction('19000000-0000-4000-8000-000000000011')), 1, 'public photo reference retained');
reset role;

set local role service_role;
select is(public.change_owned_auction_photos('19000000-0000-4000-8000-000000000011', 'f19-owner', '{}', '19000000-0000-4000-8000-000000000011/00000000-0000-4000-8000-000000000001.jpg'), false, 'removed photo would still be referenced by the cancelled auction');
select is(public.change_owned_auction_photos('19000000-0000-4000-8000-000000000012', 'f19-owner', array['19000000-0000-4000-8000-000000000012/00000000-0000-4000-8000-000000000001.jpg'], null), false, 'cancelled auction cannot publish a new photo');
reset role;

select is(private.start_auction_finalization('19000000-0000-4000-8000-000000000014'), 'cancelled', 'direct finalization still rejects a past cancellation');
do $$ begin perform private.run_auction_finalization_cycle(); end $$;
select ok(
  not exists (select 1 from public.auction_finalizations where auction_id = '19000000-0000-4000-8000-000000000014')
  and not exists (select 1 from public.auction_result_candidates where auction_id = '19000000-0000-4000-8000-000000000014')
  and not exists (select 1 from public.auction_result_offers where auction_id = '19000000-0000-4000-8000-000000000014')
  and not exists (select 1 from public.auction_finalization_events where auction_id = '19000000-0000-4000-8000-000000000014')
  and not exists (
    select 1 from public.notification_outbox
    join public.auction_finalization_events on auction_finalization_events.id = notification_outbox.event_id
    where auction_finalization_events.auction_id = '19000000-0000-4000-8000-000000000014'
  )
  and exists (select 1 from public.auction_finalizations where auction_id = '19000000-0000-4000-8000-000000000013'),
  'cycle ignores cancellation and still processes a normally ended auction'
);

select * from finish();
rollback;
