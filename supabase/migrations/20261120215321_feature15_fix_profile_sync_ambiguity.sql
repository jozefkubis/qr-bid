create or replace function public.sync_current_profile(p_display_name text, p_preferred_locale text)
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
  on conflict on constraint profiles_clerk_user_id_key do update
  set display_name = excluded.display_name,
      preferred_locale = excluded.preferred_locale,
      updated_at = statement_timestamp()
  returning profiles.id, profiles.clerk_user_id, profiles.display_name,
    profiles.preferred_locale, profiles.created_at, profiles.updated_at;
end;
$$;

revoke all on function public.sync_current_profile(text, text) from public, anon, authenticated;
grant execute on function public.sync_current_profile(text, text) to authenticated;
