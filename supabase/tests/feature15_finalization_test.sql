begin;
select plan(11);

select has_column('public', 'profiles', 'display_name', 'profile stores Clerk display name');
select has_column('public', 'profiles', 'preferred_locale', 'profile stores notification locale');
select has_index('public', 'auction_result_offers', 'auction_result_offers_one_active_per_auction_idx', 'one-active-offer index exists');

insert into public.profiles (id, clerk_user_id, display_name, preferred_locale) values
  ('10000000-0000-4000-8000-000000000001', 'owner', 'Owner', 'sk'),
  ('10000000-0000-4000-8000-000000000002', 'bidder-a', 'Bidder A', 'sk'),
  ('10000000-0000-4000-8000-000000000003', 'bidder-b', 'Bidder B', 'en');

insert into public.auctions (id, owner_id, title, description, location, starting_price_minor, min_increment_minor, starts_at, ends_at) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Ended with bids', '', 'Bratislava', 1000, 100, clock_timestamp() - interval '2 days', clock_timestamp() - interval '1 day'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Ended no bids', '', 'Bratislava', 1000, 100, clock_timestamp() - interval '2 days', clock_timestamp() - interval '1 day'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Expiry boundary', '', 'Bratislava', 1000, 100, clock_timestamp() - interval '2 days', clock_timestamp() - interval '1 day');

insert into public.bids (id, auction_id, bidder_id, amount_minor, request_id, created_at) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 1500, '40000000-0000-4000-8000-000000000001', clock_timestamp() - interval '3 hours'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 3000, '40000000-0000-4000-8000-000000000002', clock_timestamp() - interval '2 hours'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 2500, '40000000-0000-4000-8000-000000000003', clock_timestamp() - interval '1 hour'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 2000, '40000000-0000-4000-8000-000000000004', clock_timestamp() - interval '1 hour');

select is(private.start_auction_finalization('20000000-0000-4000-8000-000000000001'), 'awaiting_response', 'ended auction awaits response');
select results_eq(
  $$select count(*) from public.auction_result_candidates where auction_id = '20000000-0000-4000-8000-000000000001'$$,
  array[2::bigint], 'ranking contains each bidder once');
select results_eq(
  $$select amount_minor from public.auction_result_candidates where auction_id = '20000000-0000-4000-8000-000000000001' and bidder_id = '10000000-0000-4000-8000-000000000002'$$,
  array[3000::bigint], 'ranking keeps the bidder highest amount');
select results_eq(
  $$select expires_at - issued_at from public.auction_result_offers where auction_id = '20000000-0000-4000-8000-000000000001' and status = 'active'$$,
  array[interval '48 hours'], 'offer receives exactly 48 hours');
select is(private.start_auction_finalization('20000000-0000-4000-8000-000000000001'), 'already_started', 'start is idempotent');
select is(private.start_auction_finalization('20000000-0000-4000-8000-000000000002'), 'no_bids', 'auction without bids closes as no_bids');

select is(private.start_auction_finalization('20000000-0000-4000-8000-000000000003'), 'awaiting_response', 'expiry fixture starts');
update public.auction_result_offers
set issued_at = issued_at - interval '49 hours', expires_at = expires_at - interval '49 hours'
where auction_id = '20000000-0000-4000-8000-000000000003' and status = 'active';
select set_config(
  'test.boundary_offer_id',
  (
    select id::text
    from public.auction_result_offers
    where auction_id = '20000000-0000-4000-8000-000000000003'
      and status = 'active'
  ),
  true
);
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"bidder-a"}';
select is(
  public.respond_to_auction_result_offer(
    current_setting('test.boundary_offer_id')::uuid,
    'accept'
  ), 'expired', 'fresh database time at or after the deadline is expired');
reset role;

select * from finish();
rollback;
