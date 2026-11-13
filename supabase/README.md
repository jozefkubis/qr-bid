# QRBid Supabase workflow

## Environment

Feature 12 migrations are prepared locally first. Do not apply them to a hosted project until the target project and environment are explicitly confirmed.

Required application variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The application must never receive a Supabase secret or `service_role` key.

## Stage A verification

Run these checks with two separate Clerk accounts after the migration and native Third-Party Auth integration are active:

| Context | Expected result |
| --- | --- |
| Account A opens My Auctions twice | One profile exists for A; the second request returns the same profile. |
| Account B opens My Auctions | One different profile exists for B. |
| A selects profiles | Only A's row is returned. |
| B selects profiles | Only B's row is returned. |
| Anonymous client selects or inserts | Permission is denied or no rows are returned. |
| A inserts B's Clerk subject | RLS rejects the insert. |
| A updates or deletes any profile | Permission is denied. |

Run Supabase security and performance advisors after applying the migration. Do not continue to Stage B until this matrix passes in the approved non-production environment.
