drop policy "profiles_select_own" on public.profiles;
drop policy "profiles_insert_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (
  clerk_user_id = ((select auth.jwt()) ->> 'sub')
);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  clerk_user_id = ((select auth.jwt()) ->> 'sub')
);
