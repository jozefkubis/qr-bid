# QRBid – Progress Tracker

Update this file after meaningful implementation changes or approved product/architecture decisions. Record actual progress, not planned work as completed.

## Current Phase

- Public pages UI implementation.

## Current Goal

- Feature 03 v3 hero-only landing page is implemented and verified; awaiting product-owner review.

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
- Drafted the project overview, code standards, UI context, and AI workflow rules before implementation began.
- Added the approved Terra design tokens and Literata/Nunito Sans font setup.
- Added typed, reusable Button, Card, Input, and Textarea UI primitives with accessible states and native HTML behavior.
- Added the required `lucide-react` dependency without introducing a component library.
- Verified the initial Feature 01 implementation with TypeScript, ESLint, and `git diff --check`.
- Verified the Feature 01 production build and checked key text/focus color combinations against WCAG contrast ratios.
- Reviewed the TSX primitives against the Vercel React best-practices checklist; components remain server-compatible and use direct imports without an unnecessary barrel module.
- Approved Feature 01 as the UI foundation for Feature 02.
- Implemented the Feature 02 shared site header with QRBid branding, desktop navigation, and an accessible mobile menu.
- Added the shared header to the root layout without adding authentication placeholders or extra routes.
- Verified Feature 02 Step 1 with ESLint, a production build, a sequential TypeScript check, `git diff --check`, and a local HTTP render check.
- Implemented Feature 03 v2: one responsive hero with copy and CTAs on the left and a static parking-space auction preview on the right at desktop widths.
- Added the approved hero copy, green “Get bids.” heading and factual supporting line. Per subsequent product-owner feedback, removed the three-step explanation and replaced its CTA with “View sample auction” linking to `#sample-auction`.
- Reused the shared header and existing Card, Input and Button primitives. Sample auction values live in a local constant; suggestion chips are static spans, the amount input is read-only, and bidding uses a native disabled button with readable full-opacity styling.
- Replaced default Next.js metadata with a QRBid title and description. Added no dependencies, routes, backend integrations, timers, QR generation or persistence.
- Verified Feature 03 v2 with `npm run lint`, `npm run build`, sequential `npx tsc --noEmit`, and `git diff --check`.
- Verified layout in headless Chrome at 320, 375, 390, 768, 1024, 1280 and 1440px: no horizontal overflow; stacked text then preview below 1024px, side-by-side columns at 1024/1280/1440px; one h1 and one shared header; approximately 48px CTA targets and visible 2px keyboard focus. Confirmed read-only/disabled demo semantics and mobile menu expansion.
- Visually inspected full-page screenshots at 375px and 1440px; the desktop text-left/card-right composition and mobile stacking are confirmed.

## In Progress

- Feature 03 v3 is awaiting product-owner visual review.

## Next Up

- Review the Feature 03 v3 hero-only landing page, including mobile and desktop composition.
- Implement Feature 02 Step 3, the nonfunctional create-auction form prototype, as a separately approved task.
- Resolve the remaining auction lifecycle and registration requirements before implementing affected features.
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

- Feature 01 provides the design-system foundation; Feature 02 Step 1 adds the shared public header.
- The mobile menu uses a native button, `aria-expanded`, `aria-controls`, accessible labels, and keyboard-operable native links.
- Feature 02 Step 1 initially received structural and HTTP checks; subsequent Feature 03 browser checks confirmed mobile menu expansion and keyboard-visible focus.
- Feature 03 v2 supersedes the earlier landing-page review checkpoints and implements the complete landing page as one focused change, per the user's request on 2026-11-06.
- `/` returns HTTP 200. The required CTA points to `/auctions/new`, which still returns 404 because the separate create-auction prototype is not implemented. Navigation to a working create form remains pending; no extra route was added under Feature 03.
- Temporary full-page QA screenshots: `/tmp/qrbid-hero-375.png` and `/tmp/qrbid-hero-1440.png` (also captured at the other tested widths). Browser checks used the local production build.
- No create-auction route, database schema, authentication, deployment, or business logic has been implemented.
- A temporary component preview route was removed after browser automation became unavailable; no permanent showcase page was added.
- Use the approved project-overview.md and ui-context.md as the product and design sources of truth.
- Do not treat open questions as approved requirements.

- Product-owner screenshot feedback on 2026-11-06 approved a hero-only page: no lower “How it works” section. Feature 03 v3 documents the new scope and on-page sample CTA, with arrow/eye/location icons and static increment-plus-total chips. Terra styling and preview-only bidding remain in effect.
- Feature 03 v3 verification: lint, standalone TypeScript and diff checks pass. Inspected mobile/desktop screenshots and checked 320/375/1280/1440px layouts with no horizontal overflow, no lower explanation section, and a valid sample-card anchor. Final chip polish uses consistent mobile wrapping and a 5.51:1 text contrast.
- Initial hero-only build passed with Turbopack. After final chip polish, repeated Turbopack builds failed on an environment restriction (`binding to a port: Operation not permitted`), including the escalated retry. Final production build passed with `npm run build -- --webpack`; no configuration or dependency changes were required.
- Fixed the 404 theme collision reported after navigating to `/auctions/new` and back: root layout now explicitly declares `data-theme="light"`; the Terra body background/text rules are unlayered and scoped with higher specificity than Next.js's default 404 `body` styles. No framework internals or auction routes were changed.
- Verified on the local development server with Chrome emulating a dark system theme. Before the fix, the default 404 set black body background and white text (the intermittent persistence after return did not reproduce in this run). After the fix, initial home, 404, return via logo and browser history back all retained cream `rgb(250, 246, 240)` and dark text `rgb(46, 50, 47)`. ESLint, standalone TypeScript and diff checks passed; production build was not rerun for this focused CSS/layout fix.
