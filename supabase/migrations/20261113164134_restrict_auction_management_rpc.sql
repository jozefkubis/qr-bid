revoke execute on function public.update_owned_active_auction(
  uuid,
  text,
  text,
  bigint,
  bigint,
  timestamptz
) from anon;

revoke execute on function public.delete_owned_active_auction(uuid) from anon;
