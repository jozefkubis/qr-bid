alter table public.notification_outbox
  drop constraint notification_outbox_status_check,
  add column processing_started_at timestamptz,
  add constraint notification_outbox_status_check
    check (status in ('pending', 'processing', 'retry', 'sent', 'permanent_failure', 'superseded')),
  add constraint notification_outbox_processing_time_check
    check ((status = 'processing') = (processing_started_at is not null));

create function public.get_my_auction_result_offers()
returns table (
  offer_id uuid,
  auction_id uuid,
  title text,
  currency text,
  amount_minor bigint,
  offer_status text,
  finalization_status text,
  issued_at timestamptz,
  expires_at timestamptz,
  accepted_at timestamptz,
  owner_clerk_user_id text,
  owner_display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select offers.id, offers.auction_id, auctions.title, auctions.currency,
    candidates.amount_minor, offers.status, finalizations.status,
    offers.issued_at, offers.expires_at, offers.accepted_at,
    case
      when finalizations.confirmed_offer_id = offers.id
        and finalizations.status in ('interest_confirmed', 'sale_completed')
        and offers.status = 'accepted'
      then owners.clerk_user_id
    end,
    case
      when finalizations.confirmed_offer_id = offers.id
        and finalizations.status in ('interest_confirmed', 'sale_completed')
        and offers.status = 'accepted'
      then owners.display_name
    end
  from public.profiles as callers
  join public.auction_result_candidates as candidates
    on candidates.bidder_id = callers.id
  join public.auction_result_offers as offers
    on offers.candidate_id = candidates.id
  join public.auction_finalizations as finalizations
    on finalizations.auction_id = offers.auction_id
  join public.auctions as auctions on auctions.id = offers.auction_id
  join public.profiles as owners on owners.id = auctions.owner_id
  where callers.clerk_user_id = nullif(btrim((select auth.jwt()) ->> 'sub'), '')
  order by offers.issued_at desc, offers.id;
$$;

create function public.get_owned_auction_finalization(p_auction_id uuid)
returns table (
  auction_id uuid,
  title text,
  currency text,
  finalization_status text,
  started_at timestamptz,
  interest_confirmed_at timestamptz,
  sale_completed_at timestamptz,
  closed_at timestamptz,
  confirmed_offer_id uuid,
  confirmed_amount_minor bigint,
  confirmed_bidder_clerk_user_id text,
  confirmed_bidder_display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select auctions.id, auctions.title, auctions.currency, finalizations.status,
    finalizations.started_at, finalizations.interest_confirmed_at,
    finalizations.sale_completed_at, finalizations.closed_at,
    finalizations.confirmed_offer_id,
    case
      when finalizations.status in ('interest_confirmed', 'sale_completed')
      then candidates.amount_minor
    end,
    case
      when finalizations.status in ('interest_confirmed', 'sale_completed')
      then bidders.clerk_user_id
    end,
    case
      when finalizations.status in ('interest_confirmed', 'sale_completed')
      then bidders.display_name
    end
  from public.profiles as owners
  join public.auctions as auctions on auctions.owner_id = owners.id
  join public.auction_finalizations as finalizations
    on finalizations.auction_id = auctions.id
  left join public.auction_result_offers as offers
    on offers.id = finalizations.confirmed_offer_id
  left join public.auction_result_candidates as candidates
    on candidates.id = offers.candidate_id
  left join public.profiles as bidders on bidders.id = candidates.bidder_id
  where owners.clerk_user_id = nullif(btrim((select auth.jwt()) ->> 'sub'), '')
    and auctions.id = p_auction_id;
$$;

revoke all on function public.get_my_auction_result_offers() from public, anon, authenticated;
revoke all on function public.get_owned_auction_finalization(uuid) from public, anon, authenticated;
grant execute on function public.get_my_auction_result_offers() to authenticated;
grant execute on function public.get_owned_auction_finalization(uuid) to authenticated;

create function private.run_auction_finalization_cycle()
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

revoke all on function private.run_auction_finalization_cycle() from public, anon, authenticated;

create function private.notification_is_current(
  p_notification_type text,
  p_auction_id uuid,
  p_offer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_notification_type
    when 'offer_issued' then exists (
      select 1 from public.auction_result_offers
      where id = p_offer_id and auction_id = p_auction_id and status = 'active'
    )
    when 'interest_confirmed' then exists (
      select 1 from public.auction_finalizations
      where auction_id = p_auction_id
        and confirmed_offer_id = p_offer_id
        and status in ('interest_confirmed', 'sale_completed')
    )
    when 'sale_completed' then exists (
      select 1 from public.auction_finalizations
      where auction_id = p_auction_id
        and confirmed_offer_id = p_offer_id
        and status = 'sale_completed'
    )
    when 'no_bids' then exists (
      select 1 from public.auction_finalizations
      where auction_id = p_auction_id and status = 'no_bids'
    )
    when 'ranking_exhausted' then exists (
      select 1 from public.auction_finalizations
      where auction_id = p_auction_id and status = 'exhausted'
    )
    else false
  end;
$$;

create function public.claim_notification_outbox(p_limit integer default 10)
returns table (
  job_id uuid,
  attempt_count integer,
  notification_type text,
  locale text,
  recipient_clerk_user_id text,
  recipient_is_owner boolean,
  auction_id uuid,
  auction_title text,
  currency text,
  offer_id uuid,
  amount_minor bigint,
  expires_at timestamptz,
  finalization_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
begin
  update public.notification_outbox as outbox
  set status = 'superseded', processing_started_at = null, updated_at = v_now
  from public.auction_finalization_events as events
  where events.id = outbox.event_id
    and outbox.status in ('pending', 'retry', 'processing')
    and not private.notification_is_current(
      outbox.notification_type,
      events.auction_id,
      events.offer_id
    );

  return query
  with ready as (
    select outbox.id
    from public.notification_outbox as outbox
    where (
      outbox.status in ('pending', 'retry')
      and outbox.next_attempt_at <= v_now
    ) or (
      outbox.status = 'processing'
      and outbox.processing_started_at <= v_now - interval '5 minutes'
    )
    order by outbox.next_attempt_at, outbox.created_at, outbox.id
    for update skip locked
    limit least(greatest(coalesce(p_limit, 10), 1), 50)
  ), claimed as (
    update public.notification_outbox as outbox
    set status = 'processing', attempt_count = outbox.attempt_count + 1,
      processing_started_at = v_now, updated_at = v_now
    from ready
    where outbox.id = ready.id
    returning outbox.*
  )
  select claimed.id, claimed.attempt_count, claimed.notification_type,
    claimed.locale, recipients.clerk_user_id,
    recipients.id = auctions.owner_id, events.auction_id,
    auctions.title, auctions.currency, events.offer_id,
    candidates.amount_minor, offers.expires_at, finalizations.status
  from claimed
  join public.auction_finalization_events as events on events.id = claimed.event_id
  join public.profiles as recipients on recipients.id = claimed.recipient_profile_id
  join public.auctions as auctions on auctions.id = events.auction_id
  join public.auction_finalizations as finalizations
    on finalizations.auction_id = events.auction_id
  left join public.auction_result_offers as offers on offers.id = events.offer_id
  left join public.auction_result_candidates as candidates
    on candidates.id = offers.candidate_id
  order by claimed.next_attempt_at, claimed.created_at, claimed.id;
end;
$$;

create function public.mark_notification_outbox_sent(
  p_job_id uuid,
  p_provider_message_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
begin
  if nullif(btrim(p_provider_message_id), '') is null then
    return false;
  end if;

  update public.notification_outbox
  set status = 'sent', provider_message_id = left(btrim(p_provider_message_id), 500),
    sent_at = v_now, processing_started_at = null, updated_at = v_now,
    last_error_code = null, last_error_at = null
  where id = p_job_id and status = 'processing';
  return found;
end;
$$;

create function public.mark_notification_outbox_failed(
  p_job_id uuid,
  p_error_code text,
  p_temporary boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_count integer;
  v_now timestamptz := clock_timestamp();
  v_error_code text := left(coalesce(nullif(btrim(p_error_code), ''), 'unknown'), 120);
  v_delay interval;
begin
  select attempt_count into v_attempt_count
  from public.notification_outbox
  where id = p_job_id and status = 'processing'
  for update;
  if v_attempt_count is null then return 'unavailable'; end if;

  v_delay := case v_attempt_count
    when 1 then interval '1 minute'
    when 2 then interval '5 minutes'
    when 3 then interval '30 minutes'
    else null
  end;

  if coalesce(p_temporary, false) and v_delay is not null then
    update public.notification_outbox
    set status = 'retry', next_attempt_at = v_now + v_delay,
      processing_started_at = null, updated_at = v_now,
      last_error_code = v_error_code, last_error_at = v_now
    where id = p_job_id;
    return 'retry';
  end if;

  update public.notification_outbox
  set status = 'permanent_failure', processing_started_at = null,
    updated_at = v_now, last_error_code = v_error_code, last_error_at = v_now
  where id = p_job_id;
  return 'permanent_failure';
end;
$$;

revoke all on function private.notification_is_current(text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.claim_notification_outbox(integer) from public, anon, authenticated, service_role;
revoke all on function public.mark_notification_outbox_sent(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.mark_notification_outbox_failed(uuid, text, boolean) from public, anon, authenticated, service_role;
grant execute on function public.claim_notification_outbox(integer) to service_role;
grant execute on function public.mark_notification_outbox_sent(uuid, text) to service_role;
grant execute on function public.mark_notification_outbox_failed(uuid, text, boolean) to service_role;
