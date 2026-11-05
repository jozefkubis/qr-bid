# QRBid – Progress Tracker

Update this file after meaningful implementation changes or approved product/architecture decisions. Record actual progress, not planned work as completed.

## Current Phase

- Product planning and specification (pre-implementation).

## Current Goal

- Finalize the project context documents and resolve essential auction rules before implementation.

## Completed

- Defined the QRBid MVP concept and primary parking-space auction use case.
- Decided that auctions are discoverable through direct URLs or QR codes, without a public catalog.
- Decided that visitors can view an auction without signing in; placing bids requires authentication.
- Decided that one registered account can both create auctions and bid in other users' auctions.
- Selected Slovak and English as supported interface languages.
- Approved the Terra green-and-cream visual direction.
- Approved AUTH-001: Clerk email verification required to bid; collect full name, email and phone, but do not verify phone in MVP.
- Approved BID-001: owners cannot bid on their own auctions; enforce on server/database.
- Approved BID-002: the minimum increment is a lower bound, not a required multiple; larger arbitrary valid amounts are allowed.
- Approved BID-003: the first bid may equal the starting price; the minimum increment applies from the second bid onward.
- Approved END-001: auctions have a fixed end time and are never automatically extended by last-second bids.
- Approved BID-004: the bidding UI includes an explicit custom amount input, not only preset bid buttons; normal bid rules still apply.
- Approved EDIT-001: starting price, minimum increment and end time are locked after the first accepted bid.
- Approved END-002: owner may cancel an auction early, even after bids; cancellation declares no winner, preserves bid history and prevents further bids.
- Approved WIN-001: if the top-ranked bidder declines, offer the item to subsequent eligible bidders by descending bid amount until one accepts or the list is exhausted; each may accept or decline.
- Approved WIN-002: each next-ranked bidder receives 48 hours from system issuance of their offer to accept.
- Approved WIN-003: an unanswered offer expires after 48 hours and the system automatically contacts the next eligible bidder; progression must avoid duplicate or simultaneous active offers.
- Approved WIN-004: the original highest-ranked bidder also has 48 hours to accept; if no response, their offer expires and the next bidder is contacted. The original winner's period was specified as starting upon offer delivery; reliable delivery-time semantics still need design.
- Approved END-003: an early cancellation requires a reason, which is displayed to auction viewers and affected bidders.
- Drafted project overview, code standards, UI context, and AI workflow rules; implementation has not begun.

## In Progress

- Reviewing and adapting project context documentation for QRBid.

## Next Up

- Review and approve the architecture context.
- Resolve the remaining auction lifecycle and registration requirements.
- Design the database schema and security policies after product decisions are finalized.

## Open Questions

- How will required profile fields be collected and synchronized securely between Clerk and Supabase? (Email verification and no phone verification already decided.)
- What are the exact auction states and lifecycle transitions? Fixed end time without extension is approved (END-001); detailed closure implementation remains open.
- How are equal bids, currency precision, and concurrent bids handled? (Minimum-increment rule BID-002 is approved.)
- Which non-price auction fields can be edited after bidding starts, and what additional cancellation UX details are required? Owner cancellation is allowed even after bids (END-002). Starting price, increment and end time are locked after the first accepted bid (EDIT-001); no automatic extension (END-001). A visible cancellation reason is mandatory (END-003).
- What are the legal meaning of offers and the responsibilities of the auction owner?
- What notifications are mandatory for MVP and when are they sent?
- WIN-001 through WIN-004 cover sequential offers, 48-hour windows and automatic progression on no response. Still decide reliable offer delivery vs issuance timestamps, eligibility/ranking of multiple bids per person, contact sharing, notifications and legal effect.
- What monetization model will QRBid use?

## Architecture Decisions

- Next.js App Router, React, TypeScript, Tailwind CSS.
- Supabase PostgreSQL, Realtime, and Storage.
- Clerk authentication with verified email required for bidding; collect phone without SMS verification in MVP.
- Resend email, Vercel hosting, GitHub version control.
- Simple Next.js modular monolith; no Prisma, Liveblocks, Trigger.dev, or microservices.
- Bid acceptance must be validated server-side and handled transactionally in PostgreSQL.
- BID-001: self-bidding by the auction owner is forbidden.
- BID-002: after the first accepted bid, amount must be at least current highest bid plus minimum increment; amounts above that threshold need not be exact increment multiples.
- BID-003: the first accepted bid may equal the auction starting price.
- END-001: the scheduled auction deadline is fixed; last-second bids do not extend it.
- BID-004: show a custom bid amount input in the auction UI; optional suggested amounts are not mandatory.
- EDIT-001: starting price, minimum increment and scheduled end time become immutable after the first accepted bid.
- END-002: the owner can cancel early even after bids; cancellation is distinct from normal completion, has no winner, retains accepted bids and blocks new bids.
- END-003: early cancellation requires a non-empty reason, persisted with the cancellation and shown on the auction page; enforce server-side.
- WIN-001: if the highest-ranked bidder refuses, approach the next eligible bidder in descending bid amount order; continue until acceptance or exhaustion, with a right to decline at each step.
- WIN-002: a next-ranked bidder has 48 hours to accept, measured from system issuance of the offer using trusted server/database time.
- WIN-003: if an offer receives no response within 48 hours, it expires and the system automatically advances to the next eligible bidder, with concurrency-safe, idempotent progression.
- WIN-004: the original highest-ranked bidder has 48 hours to accept; no response triggers expiry and progression. Delivery-based start was requested for this initial offer; reliable delivery detection and reconciliation with issuance-based WIN-002 are open.
- No public auction catalog in the MVP.

## Session Notes

- This is a planning document. No code, database schema, deployment, or tests have been completed.
- Use the approved project-overview.md and ui-context.md as the product and design sources of truth.
- Do not treat open questions as approved requirements.
