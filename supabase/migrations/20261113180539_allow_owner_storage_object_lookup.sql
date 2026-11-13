create policy "auction_photo_objects_select_own_active"
on storage.objects
for select
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
