begin;
select plan(6);

select has_function(
  'public',
  'sync_current_profile',
  array['text', 'text'],
  'profile sync RPC exists'
);
select ok(
  has_function_privilege('authenticated', 'public.sync_current_profile(text,text)', 'execute'),
  'authenticated users can synchronize their profile'
);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"profile-sync-user"}';
select results_eq(
  $$select clerk_user_id, display_name, preferred_locale from public.sync_current_profile('Profile User', 'sk')$$,
  $$values ('profile-sync-user'::text, 'Profile User'::text, 'sk'::text)$$,
  'profile sync inserts the verified Clerk subject without ambiguity'
);
select results_eq(
  $$select clerk_user_id, display_name, preferred_locale from public.sync_current_profile('Updated User', 'en')$$,
  $$values ('profile-sync-user'::text, 'Updated User'::text, 'en'::text)$$,
  'profile sync updates the existing Clerk subject without ambiguity'
);
reset role;

select results_eq(
  $$select count(*) from public.profiles where clerk_user_id = 'profile-sync-user'$$,
  array[1::bigint],
  'profile sync remains idempotent per Clerk subject'
);
select results_eq(
  $$select display_name, preferred_locale from public.profiles where clerk_user_id = 'profile-sync-user'$$,
  $$values ('Updated User'::text, 'en'::text)$$,
  'profile sync persists the latest trusted values'
);

select * from finish();
rollback;
