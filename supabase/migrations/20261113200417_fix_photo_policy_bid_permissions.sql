create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.auction_has_bids(p_auction_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bids
    where bids.auction_id = p_auction_id
  );
$$;

revoke all on function private.auction_has_bids(uuid) from public, anon, authenticated;
grant execute on function private.auction_has_bids(uuid) to authenticated;

drop policy "auction_photos_insert_own_active_no_bids" on public.auction_photos;
drop policy "auction_photos_delete_own_active_no_bids" on public.auction_photos;
drop policy "auction_photo_objects_insert_own_active_no_bids" on storage.objects;
drop policy "auction_photo_objects_delete_own_active_no_bids" on storage.objects;

create policy "auction_photos_insert_own_active_no_bids"
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
      and not private.auction_has_bids(auctions.id)
  )
);

create policy "auction_photos_delete_own_active_no_bids"
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
      and not private.auction_has_bids(auctions.id)
  )
);

create policy "auction_photo_objects_insert_own_active_no_bids"
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
      and not private.auction_has_bids(auctions.id)
  )
);

create policy "auction_photo_objects_delete_own_active_no_bids"
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
      and not private.auction_has_bids(auctions.id)
  )
);
