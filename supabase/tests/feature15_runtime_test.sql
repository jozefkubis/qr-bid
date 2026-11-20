begin;
select plan(26);

select has_function('public', 'get_my_auction_result_offers', array[]::text[], 'bidder result read RPC exists');
select has_function('public', 'get_owned_auction_finalization', array['uuid'], 'owner finalization read RPC exists');
select has_function('public', 'claim_notification_outbox', array['integer'], 'outbox claim RPC exists');
select ok(has_function_privilege('authenticated', 'public.get_my_auction_result_offers()', 'execute'), 'authenticated can call bidder result RPC');
select ok(not has_function_privilege('anon', 'public.get_my_auction_result_offers()', 'execute'), 'anonymous cannot call bidder result RPC');
select ok(has_function_privilege('service_role', 'public.claim_notification_outbox(integer)', 'execute'), 'service role can claim outbox jobs');
select ok(not has_function_privilege('authenticated', 'public.claim_notification_outbox(integer)', 'execute'), 'authenticated cannot claim outbox jobs');

insert into public.profiles (id, clerk_user_id, display_name, preferred_locale) values
  ('11000000-0000-4000-8000-000000000001', 'runtime-owner', 'Runtime Owner', 'sk'),
  ('11000000-0000-4000-8000-000000000002', 'runtime-bidder', 'Runtime Bidder', 'en'),
  ('11000000-0000-4000-8000-000000000003', 'runtime-intruder', 'Runtime Intruder', 'en');

insert into public.auctions (id, owner_id, title, description, location, starting_price_minor, min_increment_minor, starts_at, ends_at) values
  ('21000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'Runtime accepted', '', 'Bratislava', 1000, 100, clock_timestamp() - interval '2 days', clock_timestamp() - interval '1 day'),
  ('21000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000001', 'Runtime no bids', '', 'Bratislava', 1000, 100, clock_timestamp() - interval '2 days', clock_timestamp() - interval '1 day'),
  ('21000000-0000-4000-8000-000000000003', '11000000-0000-4000-8000-000000000001', 'Runtime expiry', '', 'Bratislava', 1000, 100, clock_timestamp() - interval '2 days', clock_timestamp() - interval '1 day');

insert into public.bids (id, auction_id, bidder_id, amount_minor, request_id, created_at) values
  ('31000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000002', 2500, '41000000-0000-4000-8000-000000000001', clock_timestamp() - interval '2 hours'),
  ('31000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000003', '11000000-0000-4000-8000-000000000002', 2000, '41000000-0000-4000-8000-000000000002', clock_timestamp() - interval '1 hour');

select is(private.start_auction_finalization('21000000-0000-4000-8000-000000000001'), 'awaiting_response', 'accepted fixture starts');
select set_config(
  'test.runtime_offer_id',
  (
    select id::text from public.auction_result_offers
    where auction_id = '21000000-0000-4000-8000-000000000001' and status = 'active'
  ),
  true
);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"runtime-bidder"}';
select results_eq(
  $$select count(*) from public.get_my_auction_result_offers()$$,
  array[1::bigint],
  'bidder sees only their result offer'
);
select results_eq(
  $$select count(*) from public.get_my_auction_result_offers() where owner_clerk_user_id is not null$$,
  array[0::bigint],
  'owner contact is hidden before confirmation'
);
select is(
  public.respond_to_auction_result_offer(current_setting('test.runtime_offer_id')::uuid, 'accept'),
  'accepted',
  'bidder confirms interest'
);
select results_eq(
  $$select owner_clerk_user_id from public.get_my_auction_result_offers()$$,
  array['runtime-owner'::text],
  'confirmed bidder receives the owner contact identity'
);
reset role;

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"runtime-owner"}';
select results_eq(
  $$select finalization_status from public.get_owned_auction_finalization('21000000-0000-4000-8000-000000000001')$$,
  array['interest_confirmed'::text],
  'owner sees the confirmed finalization state'
);
select results_eq(
  $$select confirmed_bidder_clerk_user_id from public.get_owned_auction_finalization('21000000-0000-4000-8000-000000000001')$$,
  array['runtime-bidder'::text],
  'owner receives only the confirmed bidder contact identity'
);
reset role;

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"runtime-intruder"}';
select results_eq(
  $$select count(*) from public.get_owned_auction_finalization('21000000-0000-4000-8000-000000000001')$$,
  array[0::bigint],
  'foreign user cannot read owner finalization data'
);
reset role;

set local role service_role;
select results_eq(
  $$select count(*) from public.claim_notification_outbox(10)$$,
  array[2::bigint],
  'worker claims the two current confirmation notifications'
);
reset role;
select results_eq(
  $$select count(*) from public.notification_outbox where notification_type = 'offer_issued' and status = 'superseded'$$,
  array[1::bigint],
  'stale offer notification is closed without sending'
);

select set_config(
  'test.runtime_job_id',
  (select id::text from public.notification_outbox where status = 'processing' order by id limit 1),
  true
);
select is(
  public.mark_notification_outbox_failed(current_setting('test.runtime_job_id')::uuid, 'temporary_test', true),
  'retry',
  'first temporary failure schedules a retry'
);
select ok(
  (
    select next_attempt_at between clock_timestamp() + interval '50 seconds'
      and clock_timestamp() + interval '70 seconds'
    from public.notification_outbox
    where id = current_setting('test.runtime_job_id')::uuid
  ),
  'first retry is scheduled after approximately one minute'
);
update public.notification_outbox
set next_attempt_at = clock_timestamp() - interval '1 second'
where id = current_setting('test.runtime_job_id')::uuid;
set local role service_role;
select results_eq(
  $$select attempt_count from public.claim_notification_outbox(1)$$,
  array[2::integer],
  'retry claim increments the attempt count'
);
reset role;
select is(
  public.mark_notification_outbox_failed(current_setting('test.runtime_job_id')::uuid, 'temporary_test', true),
  'retry',
  'second temporary failure schedules another retry'
);
select ok(
  (
    select next_attempt_at between clock_timestamp() + interval '4 minutes 50 seconds'
      and clock_timestamp() + interval '5 minutes 10 seconds'
    from public.notification_outbox
    where id = current_setting('test.runtime_job_id')::uuid
  ),
  'second retry is scheduled after approximately five minutes'
);

select results_eq(
  $$select * from private.run_auction_finalization_cycle()$$,
  $$values (2::integer, 0::integer)$$,
  'cycle starts each remaining ended auction once'
);
update public.auction_result_offers
set issued_at = issued_at - interval '49 hours', expires_at = expires_at - interval '49 hours'
where auction_id = '21000000-0000-4000-8000-000000000003' and status = 'active';
select results_eq(
  $$select * from private.run_auction_finalization_cycle()$$,
  $$values (0::integer, 1::integer)$$,
  'cycle expires one due offer exactly once'
);
select results_eq(
  $$select status from public.auction_result_offers where auction_id = '21000000-0000-4000-8000-000000000003'$$,
  array['expired'::text],
  'expired offer is persisted'
);
select results_eq(
  $$select status from public.auction_finalizations where auction_id = '21000000-0000-4000-8000-000000000003'$$,
  array['exhausted'::text],
  'single-candidate expiry exhausts the ranking'
);

select * from finish();
rollback;
