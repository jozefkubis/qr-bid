begin;
select plan(11);

select has_extension('pg_cron', 'pg_cron extension is enabled');
select has_extension('pg_net', 'pg_net extension is enabled');
select has_extension('supabase_vault', 'Vault extension is enabled');
select has_function(
  'private',
  'invoke_auction_notification_worker',
  array[]::text[],
  'internal notification worker function exists'
);
select ok(
  not has_function_privilege('anon', 'private.invoke_auction_notification_worker()', 'execute'),
  'anonymous users cannot invoke the notification worker'
);
select ok(
  not has_function_privilege('authenticated', 'private.invoke_auction_notification_worker()', 'execute'),
  'authenticated users cannot invoke the notification worker'
);
select ok(
  not has_schema_privilege('anon', 'vault', 'usage'),
  'anonymous users cannot access Vault'
);
select ok(
  not has_schema_privilege('authenticated', 'vault', 'usage'),
  'authenticated users cannot access Vault'
);
select results_eq(
  $$select count(*) from cron.job where jobname = 'qrbid-auction-finalization-cycle' and active$$,
  array[1::bigint],
  'finalization cycle is scheduled once'
);
select results_eq(
  $$select count(*) from cron.job where jobname = 'qrbid-auction-notification-worker' and active$$,
  array[1::bigint],
  'notification worker is scheduled once'
);
select is(
  private.invoke_auction_notification_worker(),
  null::bigint,
  'worker safely does nothing until both Vault secrets exist'
);

select * from finish();
rollback;
