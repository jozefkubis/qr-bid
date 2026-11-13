create table public.auction_photos (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  storage_path text not null unique,
  sort_order smallint not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint auction_photos_path_not_blank check (char_length(btrim(storage_path)) > 0),
  constraint auction_photos_sort_order_range check (sort_order between 0 and 4),
  constraint auction_photos_auction_sort_unique unique (auction_id, sort_order)
);

create index auction_photos_auction_order_idx
on public.auction_photos (auction_id, sort_order);

alter table public.auction_photos enable row level security;

revoke all on table public.auction_photos from anon, authenticated;
grant select, insert, delete on table public.auction_photos to authenticated;

create policy "auction_photos_select_own"
on public.auction_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.auctions
    join public.profiles on profiles.id = auctions.owner_id
    where auctions.id = auction_photos.auction_id
      and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  )
);

create policy "auction_photos_insert_own_active"
on public.auction_photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.auctions
    join public.profiles on profiles.id = auctions.owner_id
    where auctions.id = auction_photos.auction_id
      and auctions.ends_at > statement_timestamp()
      and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  )
);

create policy "auction_photos_delete_own_active"
on public.auction_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.auctions
    join public.profiles on profiles.id = auctions.owner_id
    where auctions.id = auction_photos.auction_id
      and auctions.ends_at > statement_timestamp()
      and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'auction-photos',
  'auction-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "auction_photo_objects_insert_own_active"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'auction-photos'
  and exists (
    select 1
    from public.auctions
    join public.profiles on profiles.id = auctions.owner_id
    where auctions.id::text = (storage.foldername(name))[1]
      and auctions.ends_at > statement_timestamp()
      and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  )
);

create policy "auction_photo_objects_delete_own_active"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'auction-photos'
  and exists (
    select 1
    from public.auctions
    join public.profiles on profiles.id = auctions.owner_id
    where auctions.id::text = (storage.foldername(name))[1]
      and auctions.ends_at > statement_timestamp()
      and profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  )
);

create or replace function public.get_public_auction(p_auction_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  currency text,
  starting_price_minor bigint,
  min_increment_minor bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  photo_paths text[]
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
    auctions.currency,
    auctions.starting_price_minor,
    auctions.min_increment_minor,
    auctions.starts_at,
    auctions.ends_at,
    coalesce(
      array_agg(auction_photos.storage_path order by auction_photos.sort_order)
        filter (where auction_photos.id is not null),
      array[]::text[]
    )
  from public.auctions
  left join public.auction_photos on auction_photos.auction_id = auctions.id
  where auctions.id = p_auction_id
  group by auctions.id;
$$;

revoke all on function public.get_public_auction(uuid) from public;
grant execute on function public.get_public_auction(uuid) to anon, authenticated;

create or replace function public.update_owned_active_auction(
  p_auction_id uuid,
  p_title text,
  p_description text,
  p_starting_price_minor bigint,
  p_min_increment_minor bigint,
  p_ends_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_ends_at timestamptz;
begin
  select auctions.owner_id, auctions.ends_at
  into v_owner_id, v_ends_at
  from public.auctions
  where auctions.id = p_auction_id
  for update;

  if not found
    or v_owner_id is distinct from (
      select profiles.id
      from public.profiles
      where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or v_ends_at <= statement_timestamp()
  then
    return false;
  end if;

  update public.auctions
  set title = p_title,
      description = p_description,
      starting_price_minor = p_starting_price_minor,
      min_increment_minor = p_min_increment_minor,
      ends_at = p_ends_at,
      updated_at = statement_timestamp()
  where auctions.id = p_auction_id;

  return true;
end;
$$;

revoke all on function public.update_owned_active_auction(uuid, text, text, bigint, bigint, timestamptz) from public;
grant execute on function public.update_owned_active_auction(uuid, text, text, bigint, bigint, timestamptz) to authenticated;

create or replace function public.delete_owned_active_auction(p_auction_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_ends_at timestamptz;
begin
  select auctions.owner_id, auctions.ends_at
  into v_owner_id, v_ends_at
  from public.auctions
  where auctions.id = p_auction_id
  for update;

  if not found
    or v_owner_id is distinct from (
      select profiles.id
      from public.profiles
      where profiles.clerk_user_id = ((select auth.jwt()) ->> 'sub')
    )
    or v_ends_at <= statement_timestamp()
  then
    return false;
  end if;

  delete from public.auctions where auctions.id = p_auction_id;
  return true;
end;
$$;

revoke all on function public.delete_owned_active_auction(uuid) from public;
grant execute on function public.delete_owned_active_auction(uuid) to authenticated;
