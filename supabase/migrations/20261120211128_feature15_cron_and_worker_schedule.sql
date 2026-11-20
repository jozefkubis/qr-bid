create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

revoke all on schema cron from public, anon, authenticated;
revoke all on all tables in schema cron from public, anon, authenticated;
revoke all on all functions in schema cron from public, anon, authenticated;

revoke all on schema net from public, anon, authenticated;
revoke all on all tables in schema net from public, anon, authenticated;
revoke all on all functions in schema net from public, anon, authenticated;

revoke all on schema vault from public, anon, authenticated;
revoke all on all tables in schema vault from public, anon, authenticated;

create or replace function private.invoke_auction_notification_worker()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  worker_url text;
  worker_secret text;
begin
  select decrypted_secret
  into worker_url
  from vault.decrypted_secrets
  where name = 'qrbid_app_url';

  select decrypted_secret
  into worker_secret
  from vault.decrypted_secrets
  where name = 'qrbid_worker_secret';

  if nullif(btrim(worker_url), '') is null
    or nullif(btrim(worker_secret), '') is null then
    return null;
  end if;

  return net.http_post(
    url := rtrim(worker_url, '/') || '/api/internal/auction-finalization',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-qrbid-worker-secret', worker_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
end;
$$;

revoke all on function private.invoke_auction_notification_worker() from public, anon, authenticated;

select cron.schedule(
  'qrbid-auction-finalization-cycle',
  '* * * * *',
  $job$select * from private.run_auction_finalization_cycle();$job$
);

select cron.schedule(
  'qrbid-auction-notification-worker',
  '* * * * *',
  $job$select private.invoke_auction_notification_worker();$job$
);
