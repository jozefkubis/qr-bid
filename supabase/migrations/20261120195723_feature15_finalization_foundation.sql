alter table public.profiles
  add column display_name text,
  add column preferred_locale text not null default 'en',
  add column updated_at timestamptz not null default statement_timestamp(),
  add constraint profiles_display_name_length
    check (display_name is null or char_length(btrim(display_name)) between 1 and 120),
  add constraint profiles_preferred_locale
    check (preferred_locale in ('en', 'sk'));

revoke insert on table public.profiles from authenticated;
drop policy "profiles_insert_own" on public.profiles;

create function public.sync_current_profile(p_display_name text, p_preferred_locale text)
returns table (
  id uuid,
  clerk_user_id text,
  display_name text,
  preferred_locale text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clerk_user_id text := nullif(btrim((select auth.jwt()) ->> 'sub'), '');
  v_display_name text := btrim(p_display_name);
begin
  if v_clerk_user_id is null
    or char_length(v_display_name) not between 1 and 120
    or p_preferred_locale not in ('en', 'sk')
  then
    raise exception 'invalid_profile_sync' using errcode = '22023';
  end if;

  return query
  insert into public.profiles as profiles (clerk_user_id, display_name, preferred_locale)
  values (v_clerk_user_id, v_display_name, p_preferred_locale)
  on conflict (clerk_user_id) do update
  set display_name = excluded.display_name,
      preferred_locale = excluded.preferred_locale,
      updated_at = statement_timestamp()
  returning profiles.id, profiles.clerk_user_id, profiles.display_name,
    profiles.preferred_locale, profiles.created_at, profiles.updated_at;
end;
$$;

revoke all on function public.sync_current_profile(text, text) from public, anon, authenticated;
grant execute on function public.sync_current_profile(text, text) to authenticated;

create table public.auction_finalizations (
  auction_id uuid primary key references public.auctions(id) on delete restrict,
  status text not null,
  confirmed_offer_id uuid,
  started_at timestamptz not null default statement_timestamp(),
  interest_confirmed_at timestamptz,
  sale_completed_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint auction_finalizations_status check (status in ('awaiting_response', 'interest_confirmed', 'sale_completed', 'no_bids', 'exhausted'))
);

create table public.auction_result_candidates (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auction_finalizations(auction_id) on delete restrict,
  bidder_id uuid not null references public.profiles(id) on delete restrict,
  rank integer not null check (rank > 0),
  amount_minor bigint not null check (amount_minor between 1 and 9007199254740991),
  source_bid_id uuid not null references public.bids(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  unique (auction_id, bidder_id),
  unique (auction_id, rank)
);

create table public.auction_result_offers (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auction_finalizations(auction_id) on delete restrict,
  candidate_id uuid not null unique references public.auction_result_candidates(id) on delete restrict,
  status text not null default 'active',
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  declined_at timestamptz,
  expired_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint auction_result_offers_status check (status in ('active', 'accepted', 'declined', 'expired', 'withdrawn')),
  constraint auction_result_offers_deadline check (expires_at = issued_at + interval '48 hours'),
  constraint auction_result_offers_state_times check (
    (status = 'active' and accepted_at is null and declined_at is null and expired_at is null and withdrawn_at is null)
    or (status = 'accepted' and accepted_at is not null and declined_at is null and expired_at is null and withdrawn_at is null)
    or (status = 'declined' and accepted_at is null and declined_at is not null and expired_at is null and withdrawn_at is null)
    or (status = 'expired' and accepted_at is null and declined_at is null and expired_at is not null and withdrawn_at is null)
    or (status = 'withdrawn' and accepted_at is not null and declined_at is null and expired_at is null and withdrawn_at is not null)
  )
);

alter table public.auction_finalizations
  add constraint auction_finalizations_confirmed_offer_fkey
  foreign key (confirmed_offer_id) references public.auction_result_offers(id) on delete restrict;

create unique index auction_result_offers_one_active_per_auction_idx
on public.auction_result_offers (auction_id) where status = 'active';
create index auction_result_offers_due_idx
on public.auction_result_offers (expires_at) where status = 'active';

create table public.auction_finalization_events (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auction_finalizations(auction_id) on delete restrict,
  offer_id uuid references public.auction_result_offers(id) on delete restrict,
  event_type text not null check (event_type in ('finalization_started', 'no_bids', 'offer_issued', 'offer_declined', 'offer_expired', 'interest_confirmed', 'confirmed_bidder_withdrew', 'next_candidate_requested', 'sale_completed', 'ranking_exhausted')),
  actor_profile_id uuid references public.profiles(id) on delete restrict,
  occurred_at timestamptz not null default statement_timestamp(),
  metadata jsonb not null default '{}'::jsonb,
  constraint auction_finalization_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.auction_finalization_events(id) on delete restrict,
  recipient_profile_id uuid not null references public.profiles(id) on delete restrict,
  notification_type text not null check (notification_type in ('offer_issued', 'interest_confirmed', 'no_bids', 'ranking_exhausted', 'sale_completed')),
  locale text not null check (locale in ('en', 'sk')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'retry', 'sent', 'permanent_failure')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null,
  provider_message_id text,
  sent_at timestamptz,
  last_error_code text,
  last_error_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (event_id, recipient_profile_id, notification_type)
);

create index notification_outbox_ready_idx
on public.notification_outbox (next_attempt_at, created_at)
where status in ('pending', 'retry');

alter table public.auction_finalizations enable row level security;
alter table public.auction_result_candidates enable row level security;
alter table public.auction_result_offers enable row level security;
alter table public.auction_finalization_events enable row level security;
alter table public.notification_outbox enable row level security;
revoke all on table public.auction_finalizations, public.auction_result_candidates,
  public.auction_result_offers, public.auction_finalization_events,
  public.notification_outbox from anon, authenticated;

create schema if not exists private;

create function private.enqueue_finalization_notification(
  p_event_id uuid,
  p_recipient_profile_id uuid,
  p_notification_type text,
  p_now timestamptz
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notification_outbox (
    event_id, recipient_profile_id, notification_type, locale, next_attempt_at
  )
  select p_event_id, profiles.id, p_notification_type,
    coalesce(profiles.preferred_locale, 'en'), p_now
  from public.profiles
  where profiles.id = p_recipient_profile_id
  on conflict (event_id, recipient_profile_id, notification_type) do nothing;
$$;

create function private.issue_next_auction_result_offer(
  p_auction_id uuid,
  p_actor_profile_id uuid,
  p_now timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.auction_result_candidates%rowtype;
  v_offer public.auction_result_offers%rowtype;
  v_event_id uuid;
  v_owner_id uuid;
begin
  select candidates.* into v_candidate
  from public.auction_result_candidates as candidates
  where candidates.auction_id = p_auction_id
    and not exists (
      select 1 from public.auction_result_offers as offers
      where offers.candidate_id = candidates.id
    )
  order by candidates.rank
  limit 1;

  if v_candidate.id is null then
    update public.auction_finalizations
    set status = 'exhausted', confirmed_offer_id = null,
      closed_at = p_now, updated_at = p_now
    where auction_id = p_auction_id;
    insert into public.auction_finalization_events (auction_id, event_type, actor_profile_id, occurred_at)
    values (p_auction_id, 'ranking_exhausted', p_actor_profile_id, p_now)
    returning id into v_event_id;
    select owner_id into v_owner_id from public.auctions where id = p_auction_id;
    perform private.enqueue_finalization_notification(v_event_id, v_owner_id, 'ranking_exhausted', p_now);
    return null;
  end if;

  insert into public.auction_result_offers (auction_id, candidate_id, issued_at, expires_at)
  values (p_auction_id, v_candidate.id, p_now, p_now + interval '48 hours')
  returning * into v_offer;
  update public.auction_finalizations
  set status = 'awaiting_response', confirmed_offer_id = null,
    interest_confirmed_at = null, updated_at = p_now
  where auction_id = p_auction_id;
  insert into public.auction_finalization_events (auction_id, offer_id, event_type, actor_profile_id, occurred_at)
  values (p_auction_id, v_offer.id, 'offer_issued', p_actor_profile_id, p_now)
  returning id into v_event_id;
  perform private.enqueue_finalization_notification(v_event_id, v_candidate.bidder_id, 'offer_issued', p_now);
  return v_offer.id;
end;
$$;

create function private.start_auction_finalization(p_auction_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ends_at timestamptz;
  v_owner_id uuid;
  v_now timestamptz;
  v_event_id uuid;
begin
  select auctions.ends_at, auctions.owner_id into v_ends_at, v_owner_id
  from public.auctions where auctions.id = p_auction_id for update;
  if not found then return 'auction_not_found'; end if;
  if exists (select 1 from public.auction_finalizations where auction_id = p_auction_id) then
    return 'already_started';
  end if;
  v_now := clock_timestamp();
  if v_now < v_ends_at then return 'not_ended'; end if;

  insert into public.auction_finalizations (auction_id, status, started_at)
  values (p_auction_id, 'awaiting_response', v_now);
  insert into public.auction_finalization_events (auction_id, event_type, occurred_at)
  values (p_auction_id, 'finalization_started', v_now);

  insert into public.auction_result_candidates (auction_id, bidder_id, rank, amount_minor, source_bid_id, created_at)
  select p_auction_id, ranked.bidder_id,
    (row_number() over (order by ranked.amount_minor desc, ranked.source_bid_id))::integer,
    ranked.amount_minor, ranked.source_bid_id, v_now
  from (
    select distinct on (bids.bidder_id)
      bids.bidder_id, bids.amount_minor, bids.id as source_bid_id
    from public.bids
    where bids.auction_id = p_auction_id
    order by bids.bidder_id, bids.amount_minor desc, bids.created_at, bids.id
  ) as ranked;

  if not exists (select 1 from public.auction_result_candidates where auction_id = p_auction_id) then
    update public.auction_finalizations
    set status = 'no_bids', closed_at = v_now, updated_at = v_now
    where auction_id = p_auction_id;
    insert into public.auction_finalization_events (auction_id, event_type, occurred_at)
    values (p_auction_id, 'no_bids', v_now) returning id into v_event_id;
    perform private.enqueue_finalization_notification(v_event_id, v_owner_id, 'no_bids', v_now);
    return 'no_bids';
  end if;

  perform private.issue_next_auction_result_offer(p_auction_id, null, v_now);
  return 'awaiting_response';
end;
$$;

revoke all on function private.enqueue_finalization_notification(uuid, uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function private.issue_next_auction_result_offer(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function private.start_auction_finalization(uuid) from public, anon, authenticated;

comment on function private.start_auction_finalization(uuid) is
  'Internal idempotent Feature 15 transition. Scheduler integration is intentionally deferred.';

create function private.close_active_offer(
  p_offer_id uuid,
  p_status text,
  p_actor_profile_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auction_id uuid;
  v_offer public.auction_result_offers%rowtype;
  v_now timestamptz;
begin
  select offers.auction_id into v_auction_id
  from public.auction_result_offers as offers where offers.id = p_offer_id;
  if v_auction_id is null then return 'offer_not_found'; end if;

  perform 1 from public.auction_finalizations
  where auction_id = v_auction_id for update;
  select offers.* into v_offer from public.auction_result_offers as offers
  where offers.id = p_offer_id for update;
  if v_offer.status <> 'active' then return v_offer.status; end if;

  v_now := clock_timestamp();
  if p_status = 'expired' or v_now >= v_offer.expires_at then
    update public.auction_result_offers
    set status = 'expired', expired_at = v_now, updated_at = v_now
    where id = p_offer_id;
    insert into public.auction_finalization_events
      (auction_id, offer_id, event_type, actor_profile_id, occurred_at)
    values (v_auction_id, p_offer_id, 'offer_expired', p_actor_profile_id, v_now);
  elsif p_status = 'declined' then
    update public.auction_result_offers
    set status = 'declined', declined_at = v_now, updated_at = v_now
    where id = p_offer_id;
    insert into public.auction_finalization_events
      (auction_id, offer_id, event_type, actor_profile_id, occurred_at)
    values (v_auction_id, p_offer_id, 'offer_declined', p_actor_profile_id, v_now);
  else
    raise exception 'invalid_offer_close_status' using errcode = '22023';
  end if;

  perform private.issue_next_auction_result_offer(v_auction_id, p_actor_profile_id, v_now);
  return case when v_now >= v_offer.expires_at then 'expired' else p_status end;
end;
$$;

create function public.respond_to_auction_result_offer(p_offer_id uuid, p_response text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_auction_id uuid;
  v_offer public.auction_result_offers%rowtype;
  v_candidate public.auction_result_candidates%rowtype;
  v_owner_id uuid;
  v_now timestamptz;
  v_event_id uuid;
begin
  if p_response is null or p_response not in ('accept', 'decline') then return 'invalid_response'; end if;
  select profiles.id into v_profile_id from public.profiles
  where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub');
  if v_profile_id is null then return 'profile_missing'; end if;
  select offers.auction_id into v_auction_id from public.auction_result_offers as offers
  where offers.id = p_offer_id;
  if v_auction_id is null then return 'offer_not_found'; end if;

  perform 1 from public.auction_finalizations
  where auction_id = v_auction_id for update;
  select offers.* into v_offer from public.auction_result_offers as offers
  where offers.id = p_offer_id for update;
  select candidates.* into v_candidate from public.auction_result_candidates as candidates
  where candidates.id = v_offer.candidate_id;
  if v_candidate.bidder_id is distinct from v_profile_id then return 'forbidden'; end if;
  if v_offer.status <> 'active' then return v_offer.status; end if;

  v_now := clock_timestamp();
  if v_now >= v_offer.expires_at then
    return private.close_active_offer(p_offer_id, 'expired', v_profile_id);
  end if;
  if p_response = 'decline' then
    return private.close_active_offer(p_offer_id, 'declined', v_profile_id);
  end if;

  update public.auction_result_offers
  set status = 'accepted', accepted_at = v_now, updated_at = v_now
  where id = p_offer_id;
  update public.auction_finalizations
  set status = 'interest_confirmed', confirmed_offer_id = p_offer_id,
    interest_confirmed_at = v_now, updated_at = v_now
  where auction_id = v_auction_id;
  insert into public.auction_finalization_events
    (auction_id, offer_id, event_type, actor_profile_id, occurred_at)
  values (v_auction_id, p_offer_id, 'interest_confirmed', v_profile_id, v_now)
  returning id into v_event_id;
  select owner_id into v_owner_id from public.auctions where id = v_auction_id;
  perform private.enqueue_finalization_notification(v_event_id, v_profile_id, 'interest_confirmed', v_now);
  perform private.enqueue_finalization_notification(v_event_id, v_owner_id, 'interest_confirmed', v_now);
  return 'accepted';
end;
$$;

create function public.continue_with_next_auction_candidate(p_auction_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_profile_id uuid;
  v_offer_id uuid;
  v_now timestamptz;
begin
  select profiles.id into v_profile_id from public.profiles
  where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub');
  select auctions.owner_id into v_owner_id from public.auctions
  where auctions.id = p_auction_id;
  if v_owner_id is distinct from v_profile_id then return 'forbidden'; end if;

  select confirmed_offer_id into v_offer_id from public.auction_finalizations
  where auction_id = p_auction_id and status = 'interest_confirmed' for update;
  if v_offer_id is null then return 'unavailable'; end if;
  perform 1 from public.auction_result_offers where id = v_offer_id for update;
  v_now := clock_timestamp();
  update public.auction_result_offers
  set status = 'withdrawn', withdrawn_at = v_now, updated_at = v_now
  where id = v_offer_id and status = 'accepted';
  if not found then return 'unavailable'; end if;
  insert into public.auction_finalization_events
    (auction_id, offer_id, event_type, actor_profile_id, occurred_at)
  values (p_auction_id, v_offer_id, 'confirmed_bidder_withdrew', v_profile_id, v_now);
  insert into public.auction_finalization_events
    (auction_id, offer_id, event_type, actor_profile_id, occurred_at)
  values (p_auction_id, v_offer_id, 'next_candidate_requested', v_profile_id, v_now);
  perform private.issue_next_auction_result_offer(p_auction_id, v_profile_id, v_now);
  return 'continued';
end;
$$;

create function public.complete_auction_sale(p_auction_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_profile_id uuid;
  v_offer_id uuid;
  v_candidate_id uuid;
  v_bidder_id uuid;
  v_now timestamptz;
  v_event_id uuid;
begin
  select profiles.id into v_profile_id from public.profiles
  where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub');
  select auctions.owner_id into v_owner_id from public.auctions where auctions.id = p_auction_id;
  if v_owner_id is distinct from v_profile_id then return 'forbidden'; end if;
  select confirmed_offer_id into v_offer_id from public.auction_finalizations
  where auction_id = p_auction_id and status = 'interest_confirmed' for update;
  if v_offer_id is null then return 'unavailable'; end if;
  perform 1 from public.auction_result_offers where id = v_offer_id for update;
  v_now := clock_timestamp();
  update public.auction_finalizations
  set status = 'sale_completed', sale_completed_at = v_now,
    closed_at = v_now, updated_at = v_now
  where auction_id = p_auction_id;
  insert into public.auction_finalization_events
    (auction_id, offer_id, event_type, actor_profile_id, occurred_at)
  values (p_auction_id, v_offer_id, 'sale_completed', v_profile_id, v_now)
  returning id into v_event_id;
  select candidate_id into v_candidate_id from public.auction_result_offers where id = v_offer_id;
  select bidder_id into v_bidder_id from public.auction_result_candidates where id = v_candidate_id;
  perform private.enqueue_finalization_notification(v_event_id, v_owner_id, 'sale_completed', v_now);
  perform private.enqueue_finalization_notification(v_event_id, v_bidder_id, 'sale_completed', v_now);
  return 'sale_completed';
end;
$$;

revoke all on function private.close_active_offer(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.respond_to_auction_result_offer(uuid, text) from public, anon, authenticated;
revoke all on function public.continue_with_next_auction_candidate(uuid) from public, anon, authenticated;
revoke all on function public.complete_auction_sale(uuid) from public, anon, authenticated;
grant execute on function public.respond_to_auction_result_offer(uuid, text) to authenticated;
grant execute on function public.continue_with_next_auction_candidate(uuid) to authenticated;
grant execute on function public.complete_auction_sale(uuid) to authenticated;
