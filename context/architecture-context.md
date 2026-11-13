# QRBid — Architecture Context

**Status:** Draft v0.8 — AUTH-001, BID-001/002/003/004, END-001/002/003 and EDIT-001 approved; other decisions remain open.

## Architecture Goal

Build a small, secure, maintainable QR-code auction SaaS as a **modular monolith in Next.js**. Prioritize the first real parking-space auction and a usable mobile bidding experience. Avoid extra services and speculative abstractions.

## Stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Application | Next.js App Router, React, TypeScript | Pages, server-side logic, API boundaries |
| UI | Tailwind CSS | Responsive UI; visual rules live in `ui-context.md` |
| Authentication | Clerk | Sign-in, identity, session verification |
| Database | Supabase PostgreSQL | Auctions, bids, user-linked records |
| Live updates | Supabase Realtime | Display committed auction/bid changes; never validate bids |
| Images | Supabase Storage | Auction photos with access policies |
| Email | Resend | Bid and auction notifications, scope to be finalized |
| Hosting | Vercel | Deploy Next.js application |
| Version control | GitHub | Source and review history |
| QR and PDF | Libraries to select later | Shareable auction QR and A4 poster export |

No Prisma, Liveblocks, Trigger.dev, Vercel Blob, microservices, or payment provider in the MVP.

## System Boundaries

- `app/` — Routes, pages, layouts, and thin server entry points.
- `components/` — Reusable UI and auction-specific presentation.
- `lib/` — Small infrastructure helpers, including authenticated server access to Clerk and Supabase.
- `features/` — **Optional**, introduce only if feature complexity justifies it; do not scaffold preemptively.
- PostgreSQL — Source of truth for bids, auction timing, and highest valid offer.
- Supabase Storage — Auction images in the `auction-photos` bucket. Stage C uses public object reads for approved unlisted visitor media; authenticated upload/delete policies still require ownership of the active auction.
- Resend — Delivery mechanism, not source of truth for auction state.

Keep domain rules server-side. Browser clients must not be able to write trusted bid state directly.

## Data Model

- **User profile:** Stage A uses an internal UUID and a unique `clerk_user_id` mapped to the verified text `sub` from a native Clerk Third-Party Auth session token. Email remains in Clerk. Full name, phone and preferred language are added only when a concrete flow requires them; phone is not verified in MVP.
- **Auction:** Stage B persists an internal UUID, immutable owner profile UUID, title, optional description, EUR amounts in integer minor units, start/end times and timestamps. Stage C adds ordered photo metadata with cascading deletion. Active/ended presentation is derived from trusted timestamps; bids, cancellation state and broader lifecycle persistence remain in later approved stages.
- **Bid:** auction, bidder identity, amount, accepted timestamp; immutable accepted bid history.
- **Notification delivery:** optional persistence/idempotency strategy to be decided when implementing email workflows.

Store monetary values as exact decimal or integer minor units, **never floating-point arithmetic**. Store timestamps in UTC and render them in the appropriate user-facing time zone. Do not finalize schema or RLS policies before the bid and visibility rules are approved.

## Identity, Visibility, and Authorization

- A registered account may create auctions and bid on other users' auctions.
- Auctions are **unlisted**: accessible by direct URL/QR, without a public catalog. Anyone with the URL can view the permitted public auction detail without signing in.
- Authentication is required to place a bid or manage an auction. A verified email address in Clerk is additionally required to bid.
- Full name, email, and phone are required at registration; phone verification by SMS is out of MVP scope. An unverified phone number is not proof of identity.
- Every server mutation verifies Clerk identity and ownership/permission; never trust user IDs, auction status, price, or deadlines supplied by the browser.
- Stage B auction creation uses a Server Action that re-verifies Clerk identity, derives `owner_id` from the current profile and validates text, exact minor-unit money conversion and a future end time. Database constraints independently enforce title/description bounds, positive safe-range amounts, EUR and `ends_at > starts_at`.
- Owner-scoped auction SELECT/INSERT uses RLS against the verified Clerk `sub` through `profiles`; authenticated UPDATE/DELETE and all anonymous auction grants remain absent until a later stage explicitly needs them.
- Stage C keeps direct auction UPDATE/DELETE grants absent. Narrow authenticated database functions lock the target row, derive ownership from the Clerk JWT mapping and require an active auction before changing or deleting it. Stage D must extend the same locked operations with accepted-bid checks.
- Bid-aware photo metadata and Storage policies must not query the private `bids` table as the caller. They use a narrowly granted `SECURITY DEFINER` boolean helper in the unexposed `private` schema, with an empty search path, while direct `anon` and `authenticated` table access to `bids` remains revoked.
- Public real-auction reads use a parameterized database function that returns only title, description, EUR pricing, times and ordered photo paths. It does not return owner/profile IDs, Clerk subjects, emails or bidder data. Direct anonymous table access remains unavailable.
- Auction photos are limited to five objects of at most 5 MB each and MIME types JPEG, PNG or WebP. The bucket enforces size/type and the server validates them before upload. Object keys use `<auction UUID>/<random UUID>.<extension>`; metadata records the path and stable sort slot. Partial create uploads remove written metadata/objects before rolling back the new auction.
- Authenticated owners receive active-auction Storage SELECT only so the Storage API can resolve objects before an authorized delete. Deletion treats an empty/partial Storage response as failure and keeps database metadata; whole-auction cleanup lists the owned auction folder first so retry can also remove orphaned objects from an earlier partial failure.
- Next.js Server Actions allow a 26 MB multipart body for the maximum five 5 MB photos plus form overhead; individual-file and count validation remains stricter. Hosting request limits must be verified before production deployment and may require direct authenticated Storage uploads if the platform limit is lower.
- Clerk ↔ Supabase identity uses native Clerk Third-Party Auth. User-scoped Supabase clients pass the current Clerk session token. RLS compares the token's verified text `sub` with `profiles.clerk_user_id`; it does not assume `auth.uid()` equals a Clerk ID. `profiles.id` remains an independent internal UUID.
- Enable RLS on exposed Supabase tables and define least-privilege policies. Keep privileged keys on the server only. Protect bidder contact details from public access; release to the owner only under the approved winner workflow.

## Bid Processing — Critical Invariants

1. Only an authenticated and authorized bidder can submit a bid.
2. The server/database validates auction eligibility, end time, minimum accepted amount, and the bidder's permission.
3. **Acceptance is atomic and concurrency-safe in PostgreSQL**: concurrent bids cannot both be accepted against the same stale highest amount. The transaction rechecks current state under an appropriate locking/serialization strategy.
4. A rejected bid does not change auction state. Accepted bids have an auditable record.
5. The client never decides whether a bid won or is valid; Supabase Realtime only publishes committed changes.
6. **BID-001 (approved):** The auction owner cannot bid on their own auction. Enforce this against authenticated identity and persisted ownership on the server/database, not only in UI.
7. **BID-002 (approved):** The minimum increment is a lower bound, not a fixed step. A bidder may submit any monetary amount at least the current highest accepted bid plus the auction minimum increment. When there are no accepted bids, BID-003 applies.
8. **BID-003 (approved):** The first accepted bid may equal the starting price; the minimum increment applies only after an accepted bid exists.
9. **BID-004 (approved UI requirement):** Provide a clearly labeled custom bid amount input (e.g. “Enter your own amount”) so bidders can enter any valid amount meeting BID-002/BID-003; any suggested amounts are optional conveniences, never the only way to bid. The server applies the same validation regardless of input method.
10. Idempotency/retry and spam/rate-limit safeguards must be specified before bidding goes live.

**Implementation proposal, not yet approved:** a narrowly scoped server endpoint calling a transactional PostgreSQL function for bid acceptance. Review privilege boundaries, RLS, callable function grants, and identity verification before selecting the exact mechanism.

## Auction Editing

#### Feature 12 Stage D transactional bidding (2026-11-13)

- `bids` stores accepted absolute amounts and a bidder-scoped request UUID. Direct Data API writes are revoked; the only bid mutation is a narrowly granted authenticated database function.
- Bid acceptance derives the bidder from the verified Clerk JWT/profile mapping, locks the auction row, checks an exact request replay before mutable auction state, then validates ownership, database time and the latest minimum in the same transaction. Exact retries return the original accepted record; reuse of the request UUID with another amount is rejected.
- Public auction reads aggregate the current highest amount, count and anonymous amount/time history without returning `bidder_id`. Owner bid summaries are exposed through a separate identity-checked function.
- The same auction-row lock protects owner update/delete decisions. Once a bid exists, details, schedule, photos and deletion are denied; an active owner may publish a timestamped `auction_notes` update instead.

#### Feature 12 Stage E Realtime (2026-11-13)

- An after-insert trigger on accepted `bids` emits a public Supabase Broadcast signal to `auction:{uuid}:bids`. Public channel visibility matches the approved anonymous unlisted detail; the UUID-scoped topic is shareable in the same way as the auction URL.
- The payload contains only `{ changed: true }`. It never carries amount, bidder identity or authoritative auction state. Clients respond by refreshing the server-rendered detail from `get_public_auction`; PostgreSQL remains the only bid validator and source of truth during Realtime outages.
- The trigger function has an empty search path and no direct `PUBLIC`, `anon` or `authenticated` execute grant. The browser uses only the publishable key and removes its channel on unmount.

- **EDIT-001 (approved):** After the first accepted bid, lock the auction starting price, minimum increment and scheduled end time. Enforce this in server/database authorization and update logic, not only by disabling form fields.
- Whether title, description, images or other fields may be edited after bidding starts remains undecided. Early cancellation is permitted under END-002; the remaining cancellation UX and pre-first-bid editing rules remain open.

## Auction End and Notifications

- **END-002 (approved):** The auction owner may cancel an auction before its scheduled end, including after accepted bids exist, for personal or other reasons. Cancellation is a distinct terminal state (`cancelled`) from normal completion (`completed`); no winner is declared on cancellation. Accepted bid records remain preserved for audit, and no further bids are accepted. Authorization, status transition and race conditions with concurrent bids must be enforced transactionally on the server/database.
- **END-003 (approved):** The auction owner must provide a non-empty cancellation reason when cancelling early. The reason is stored with the cancelled auction and displayed to people viewing its auction page, including affected bidders. Validate the reason server-side and persist it atomically with the cancellation; do not allow cancelling without a reason. Exact length limits and presentation details remain open.
- Cancellation notifications to affected bidders are planned; precise recipients, timing and delivery guarantees remain to be specified before implementation.

- **END-001 (approved):** Auctions end at their fixed scheduled end time. Accepted bids never automatically extend the deadline.
- Auction end and bid acceptance must be evaluated against trusted server/database time, not a browser countdown. A bid arriving at or after the deadline is rejected, even if the client countdown has not updated. The exact timestamp boundary and transaction semantics must be tested before implementation.
- The final winner is derived from the accepted bids under approved ending rules.
- **WIN-001 (approved):** If the highest-ranked bidder declines to proceed, the item is offered to the next eligible bidder in descending bid-amount order. Continue sequentially until a bidder accepts or the eligible list is exhausted. Each contacted bidder may accept or decline; no automatic purchase obligation or automatic transfer is created by this fallback workflow.
- **WIN-002 (approved):** Each next-ranked bidder contacted under WIN-001 has 48 hours to accept the offer. The period begins when the offer is issued by the system, using a trusted server/database timestamp. The offer must not remain actionable after its deadline.
- **WIN-003 (approved):** If a contacted bidder does not respond within their 48-hour window, the offer expires and the system automatically proceeds to the next eligible bidder in rank order. Expiry and advancement must be idempotent and concurrency-safe; never have two actionable offers at once. The scheduling mechanism remains undecided.
- **WIN-004 (approved):** The original highest-ranked bidder also has 48 hours to accept the initial offer. If they do not respond within that window, their offer expires and the system proceeds to the next eligible bidder under WIN-001 and WIN-003. The user specified the initial window starts on **delivery** of the offer; how delivery is reliably established (versus issuance), and failure-to-deliver handling, remain open and must be decided before implementation.
- The exact acceptance/decline process, delivery/issuance timestamp semantics, tie-breaking, repeated bids by the same person, contact disclosure, notifications and legal characterization remain open. Do not implement this workflow until those details are approved.
- Owner and winner should receive an email after closure; confirmation and outbid emails are desired but may be narrowed for MVP.
- The scheduling/trigger mechanism for closing auctions and retrying emails is **not decided**. Do not introduce a background service until its need is demonstrated.
- Emails must respect EN/SK language preference; seller-authored text is not auto-translated.

## Public UI and QR

- Mobile-first auction detail is the main QR destination.
- The bidding UI includes an explicit custom-amount field (BID-004), in addition to any optional quick-bid choices. Display the minimum permitted amount and validation feedback clearly.
- QR encodes the auction's shareable URL; the A4 poster uses that same destination.
- Public access via a link is **not** a guarantee of secrecy: links can be forwarded.
- Design tokens and UI composition belong in `ui-context.md`; coding conventions in `code-standards.md`.

## Internationalization

- `next-intl` provides EN/SK locale routing and message catalogs. User-facing pages always use `/en/...` or `/sk/...`; route identifiers and user-generated auction content are not translated.
- One root `proxy.ts` composes Clerk with locale routing. Explicit locale prefixes always win. Unprefixed legacy URLs use the manually saved `qrbid_locale` cookie, then weighted `Accept-Language` matching for only `en` or `sk`, then English fallback. Czech and other unsupported languages do not imply Slovak.
- A manual switch writes the locale cookie through a validated server action with `SameSite=Lax`, `Path=/`, a one-year lifetime and `Secure` on HTTPS. Visiting a shared localized URL does not overwrite the saved preference.
- Clerk components receive the matching official `@clerk/localizations` resource. Provider-controlled OAuth pages can remain outside QRBid's localization control.

## Open Decisions — Resolve Before Implementation of Affected Features

1. **Resolved (AUTH-001):** Clerk verifies email; full name, email, and phone are collected; phone is not verified in MVP. Exact collection/synchronization mechanics remain to be designed.
2. **Resolved (BID-001):** Auction owners cannot bid on their own auctions.
3. **Resolved (BID-002):** Minimum increment is a lower bound; higher arbitrary amounts are permitted (subject to currency precision).
4. **Resolved (BID-003):** The first bid may equal the starting price; subsequent bids must meet BID-002.
5. **Resolved (END-001):** Fixed auction end time, without automatic extensions.
6. **Resolved (BID-004):** Bidder can enter a custom monetary amount; optional quick bids do not replace this input.
7. **Resolved (EDIT-001):** Lock starting price, minimum increment and end time after first accepted bid.
8. **Resolved (END-002):** Owner may cancel early even after bids; cancelled is not completed, no winner, retain bid audit history and block new bids.
9. **Resolved (END-003):** Early cancellation requires a reason visible to auction viewers.
10. **Resolved (WIN-001):** On refusal by the highest-ranked bidder, offer sequentially to the next eligible bidder by bid amount; each can accept or decline, until accepted or exhausted.
11. **Resolved (WIN-002):** Each next-ranked bidder has 48 hours from system issuance of their offer to accept.
12. **Resolved (WIN-003):** An unanswered offer expires after 48 hours and the next eligible bidder is contacted automatically.
13. **Resolved (WIN-004):** The original highest-ranked bidder also receives a 48-hour acceptance window, with automatic advancement on no response; reliable delivery-time semantics remain to be designed.
14. Still open: currency and precision, bid cancellations, and tie/concurrency behavior.
15. Auction lifecycle: draft/publish, edits to other fields after first bid, cancellation UX details, precise end semantics.
16. Winner contact exchange and legal meaning of offers (including Slovak/EU legal review as appropriate).
17. **Resolved for Stage A:** native Clerk Third-Party Auth, request-scoped user token, text `sub` mapped to an internal profile UUID, and least-privilege profile RLS. Hosted configuration and A/B/anonymous verification remain pending.
18. Closure scheduling and notification reliability/idempotency.
19. **Partially resolved for Stage C:** unlisted auction media uses public object reads, with owner-only active-auction upload/delete; five files, 5 MB each, JPEG/PNG/WebP. Long-term retention and GDPR policy remain open.
20. Monetization (not required for first working auction).

## Architecture Invariants

1. One Next.js application; no microservices for MVP.
2. Database is the authority for auction state and accepted bids.
3. All mutations authenticate, authorize, and validate input on the server; RLS provides defense in depth.
4. Accepted bid processing is atomic and race-safe.
5. Private personal data and privileged credentials are never exposed to public clients.
6. Realtime is for display, not enforcement.
7. Changes are made in small, tested increments; unresolved behavior is documented before coding.
