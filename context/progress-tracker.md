# QRBid – Progress Tracker

Update this file after meaningful implementation changes or approved product/architecture decisions. Record actual progress, not planned work as completed.

## Current Phase

- Authenticated dashboard UI.

## Current Goal

- Review the completed Feature 10 demo-data refinement on mobile and in English while signed in.

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


- Implemented Feature 04 as a static Server Component in `components/landing/how-it-works.tsx`, rendered immediately after the existing hero. Exact approved intro, step descriptions and footer copy are used.
- Added a full-width muted warm background, centered content, three lighter Card primitives, decorative Lucide icons, step labels and aligned footers. Desktop cards are equal-height in three columns; mobile/tablet use one column.
- Preserved hero layout, sample CTA, disabled demo bidding and shared header. Added no dependencies, routes, state or backend functionality.
- Verified Feature 04 with ESLint, `npm run build -- --webpack`, standalone `npx tsc --noEmit`, and `git diff --check`. Webpack was used because previous Turbopack runs encountered sandbox port restrictions.
- Checked Chrome at 375/768/1280/1440px: full-width background `rgb(243, 237, 228)`, no horizontal overflow, three desktop cards with equal 370px height and aligned footers, mobile/tablet stacking, decorative icons hidden from assistive technology, and preserved two-column desktop hero. Visually inspected 375px and 1440px screenshots in `/tmp/qrbid-feature04-375.png` and `/tmp/qrbid-feature04-1440.png`.


- Implemented Feature 05 in static `FinalCta` and `SiteFooter` components, composed after HowItWorks with the footer outside `main` and the CTA section. Earlier section content and links are preserved.
- CTA continues the preceding `bg-surface-muted` content area, uses a solid `bg-primary` panel, exact approved English copy, and one contrasting light Link to `/auctions/new`. Footer uses the same `bg-surface` token as SiteHeader, a top border, a home-linked text brand and server-evaluated copyright year (2026). Added no extra routes, dependencies or backend features.
- Feature 05 checks passed: `npm run lint`, default `npm run build` (Turbopack), standalone `npx tsc --noEmit`, and `git diff --check`. Production Chrome checks at 375/1280/1440px confirmed one separate footer, identical header/footer background `rgb(255, 253, 249)`, continuous section background `rgb(243, 237, 228)`, green panel `rgb(74, 124, 89)`, approximately 48px CTA height, visible 2px focus and no horizontal overflow. Inspected mobile and desktop screenshots (`/tmp/qrbid-feature05-375.png`, `/tmp/qrbid-feature05-1440.png`).
- Feature 05 contrast checks: white panel text 4.86:1, dark-green button text 6.31:1 (hover 5.51:1), footer copyright 5.49:1. CTA target `/auctions/new` remains unimplemented and returns 404; no auction-creation functionality is claimed.
- Implemented Feature 07 with the existing Clerk application and installed `@clerk/nextjs` v7 SDK. Added `ClerkProvider`, a root `proxy.ts`, catch-all `/sign-in` and `/sign-up` pages, modal sign-in entry points, a signed-in `UserButton`, and server-side protection for `/auctions/new` using `auth.protect()`.
- Existing create-auction CTAs open Clerk's sign-in modal while signed out and retain `/auctions/new` as the post-auth destination. The landing page remains public; no public auction route was invented or blanket-protected.
- Added a Next.js 16 `Suspense` boundary around the pathname-dependent shared header and a colocated loading UI for the protected create-auction page, preserving Cache Components and Partial Prerendering.
- Applied product-owner screenshot feedback: desktop header order is Home, Create an auction, EN/SK, then Clerk user avatar at the far right. The expanded mobile menu keeps EN/SK immediately before the account control.
- Feature 07 checks passed after the final header-order refinement: ESLint, standalone TypeScript, `git diff --check`, and the default Turbopack production build. The build generated `/`, `/auctions/new`, `/sign-in/[[...sign-in]]`, and `/sign-up/[[...sign-up]]`, with Proxy active. A clean in-app browser smoke test was attempted, but the browser access host was unavailable; current visual and end-to-end Clerk verification therefore remains unconfirmed.
- The product owner manually confirmed that Clerk authentication works and supplied a signed-in header screenshot showing the Clerk user avatar. Automated browser verification remains unavailable, so only the manually observed flow is confirmed.
- Facebook OAuth returned Meta's “Application is not active” screen while Clerk was using shared development credentials with `Use custom credentials` disabled. Facebook sign-up/sign-in was therefore intentionally disabled for now; email and the other working configured methods remain available. Re-enable Facebook only after the shared provider works again or a dedicated Meta app, exact Clerk redirect URI, App ID and App Secret are configured. No QRBid code or secret files were changed for this provider issue.
- Implemented Feature 08 with `next-intl` 4.14.9 and `@clerk/localizations` 4.24.6. Existing routes now use always-present `/en` and `/sk` prefixes; legacy `/`, `/sign-in`, `/sign-up` and `/auctions/new` redirect safely while preserving query parameters.
- Added exactly two parity-checked catalogs, `messages/en.json` and `messages/sk.json`, with 107 matching leaf keys. Localized all currently implemented navigation, landing, sample auction, How It Works, CTA/footer, create-auction form, photo picker, duration/time-zone UI, metadata, accessibility labels, client feedback and loading UI. Dates, numbers and EUR display use the active locale without changing stored sample values.
- Replaced disabled language previews in header, mobile menu and footer with an accessible working switcher that preserves the current path, query and hash. Manual selection is stored for one year through a validated server action; switching on the create-auction page warns that unsaved local state and selected photos will be lost.
- Locale negotiation is deterministic: explicit URL prefix wins; unprefixed requests use `qrbid_locale`, then weighted `Accept-Language` for only Slovak or English, then English fallback. Opening an explicit localized link does not overwrite a prior manual cookie. HTTP checks confirmed Slovak, English, German and Czech cases plus legacy query preservation.
- Clerk receives official EN/SK localization resources, and localized modal/dedicated auth URLs preserve locale. Provider-owned OAuth pages may remain provider-localized. Facebook remains disabled pending a working shared provider or dedicated Meta credentials; Feature 08 did not alter Clerk Dashboard settings or secrets.
- Strengthened `/en|sk/auctions/new` protection in the single composed Clerk/locale proxy while retaining page-level `auth.protect()`. Signed-out HTTP checks now return `307` to the matching localized sign-in route and expose no protected form HTML.
- Feature 08 verification passed: ESLint, standalone TypeScript, default Turbopack production build, `git diff --check`, catalog JSON/parity checks and targeted production HTTP tests. The build generated EN/SK variants of all confirmed routes with one Proxy entry point.
- Implemented Feature 09 as a frontend-only authenticated My Auctions page at `/en/my-auctions` and `/sk/my-auctions`. The page uses the Terra system and contains the approved description/filter preview, exactly three summary cards, exactly two static non-interactive ghost auction cards, and a localized Create Auction CTA. No auction records, calculated statistics, filtering, QR tracking, database work or new dependencies were added.
- Added page-level `auth.protect()` and extended the existing composed proxy protection for both localized My Auctions routes. Signed-out HTTP checks return `307` to the matching localized sign-in page with a fixed internal `redirect_url`; `/en` remains public and returns `200`.
- Added the signed-in-only My Auctions link using the existing Clerk `Show` pattern. Product-owner refinement moved it directly beside QRBid in the top bar at every width and removed its duplicate from the right desktop navigation and expanded mobile menu. Added EN/SK translations with 129 matching catalog leaf keys and localized metadata, summary-card copy, accessible filter-preview help and ghost-card descriptions.
- Feature 09 verification passed after the summary-card refinement: ESLint, standalone TypeScript with incremental mode disabled, default Turbopack production build, catalog JSON/parity validation and `git diff --check`. The build generated both localized My Auctions routes. The earlier signed-in English desktop check confirmed the protected route and overall page structure; the refined compact cards and left-aligned header link still need a refreshed browser visual check because the open Edge page remained on stale development output and was not reloaded automatically.
- Implemented Feature 10 as a local frontend-only demo-data refinement of the authenticated My Auctions page. Added exactly four clearly fictional records (three active and one ended), responsive auction cards, localized EUR/date/countdown presentation, a zero-bid state and neutral Terra placeholders because the repository contains no approved local cover-image assets.
- Replaced the Feature 09 preview filters and ghost cards with functional client-side All/Active/Ended filters and real demo cards. The countdown updates once per minute after hydration; filters do not reload the page. QR sharing and auction-detail controls remain disabled with visible explanations, and Feature 11/12 functionality was not implemented.
- Replaced the earlier illustrative analytics with honest demo summaries: three active auctions, one ended auction and unavailable physical-scan data. No real-time, monetary-total or scan-tracking claims remain. No database, Supabase, API, persistence, QR generation, detail routes or new dependencies were added.
- Added EN/SK Feature 10 copy with 143 matching catalog leaf keys and synchronized `context/ui-context.md`. Feature 10 verification passed with ESLint, standalone TypeScript with incremental mode disabled, the default Turbopack production build, catalog JSON/parity validation, demo-data count validation and `git diff --check`.
- Manually reviewed the signed-in Slovak desktop page in Edge. Confirmed all four cards, accessible active/ended badges and countdowns, localized EUR values, the zero-bid state, disabled future actions with explanations and the All-to-Active filter transition without navigation. The browser's native control became unreliable when targeting the Ended button, so that exact interaction was not claimed as manually verified.

## In Progress

- Feature 08 browser visual review and interactive Clerk/switcher smoke testing remain for the product owner because this Codex CLI session has no browser host. Code, build and HTTP behavior are verified.
- Feature 10 mobile layout and signed-in English visual review remain. The Slovak desktop page and Active filter were manually verified; the Ended filter is covered by the same implemented filter path and code/build checks but still needs a clean manual click-through.

## Next Up

- Review `/en/my-auctions` at desktop and narrow mobile widths while signed in; confirm no horizontal overflow and manually click All, Active and Ended in one clean session.
- Review `/en`, `/sk`, localized auth modals/pages, switcher behavior and long Slovak labels on mobile and desktop.
- Re-enable Facebook only after its OAuth provider is active; code integration alone does not activate provider-side OAuth.
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
- At the Feature 03 checkpoint, `/` returned HTTP 200 and `/auctions/new` returned 404. Feature 06 now provides the working UI-only form at that destination.
- Temporary full-page QA screenshots: `/tmp/qrbid-hero-375.png` and `/tmp/qrbid-hero-1440.png` (also captured at the other tested widths). Browser checks used the local production build.
- Feature 06 now implements the create-auction route as a UI prototype. Database schema, authentication, deployment and business logic remain unimplemented.
- A temporary component preview route was removed after browser automation became unavailable; no permanent showcase page was added.
- Use the approved project-overview.md and ui-context.md as the product and design sources of truth.
- Do not treat open questions as approved requirements.

- Product-owner screenshot feedback on 2026-11-06 approved a hero-only page: no lower “How it works” section. Feature 03 v3 documents the new scope and on-page sample CTA, with arrow/eye/location icons and static increment-plus-total chips. Terra styling and preview-only bidding remain in effect.
- Feature 03 v3 verification: lint, standalone TypeScript and diff checks pass. Inspected mobile/desktop screenshots and checked 320/375/1280/1440px layouts with no horizontal overflow, no lower explanation section, and a valid sample-card anchor. Final chip polish uses consistent mobile wrapping and a 5.51:1 text contrast.
- Initial hero-only build passed with Turbopack. After final chip polish, repeated Turbopack builds failed on an environment restriction (`binding to a port: Operation not permitted`), including the escalated retry. Final production build passed with `npm run build -- --webpack`; no configuration or dependency changes were required.
- Fixed the 404 theme collision reported after navigating to `/auctions/new` and back: root layout now explicitly declares `data-theme="light"`; the Terra body background/text rules are unlayered and scoped with higher specificity than Next.js's default 404 `body` styles. No framework internals or auction routes were changed.
- Verified on the local development server with Chrome emulating a dark system theme. Before the fix, the default 404 set black body background and white text (the intermittent persistence after return did not reproduce in this run). After the fix, initial home, 404, return via logo and browser history back all retained cream `rgb(250, 246, 240)` and dark text `rgb(46, 50, 47)`. ESLint, standalone TypeScript and diff checks passed; production build was not rerun for this focused CSS/layout fix.
- Feature 04 was explicitly requested on 2026-11-06 and supersedes the earlier Feature 03 hero-only page-end restriction by adding the newly specified section. The existing “View sample auction” CTA continues to target the preview card.
- Mobile-menu follow-up: the existing dev server on port 3000 did not hydrate/respond during browser QA. Confirmed the unchanged header works on the separate production server (port 3100): `aria-expanded` changes from false to true and both mobile links appear. If the development page remains unresponsive, restart the dev server; no header code was changed for Feature 04.
- Applied the approved Feature 04 icon refinement: replaced the third card's gavel with `BellRing` and added small decorative `Clock`, `Printer`, and `Zap` icons to the three footer lines. Icons are hidden from assistive technology, cannot shrink, and keep text wrapping usable. Updated Feature 04's icon guidance. ESLint, standalone TypeScript and `git diff --check` passed; production build was not repeated for this icon-only change.
- Verification correction discovered during Feature 05: the Webpack build compiles but does not process Tailwind under this project’s Turbopack-only CSS loader configuration. Earlier successful Webpack checks establish compilation only, not production visual correctness. Default Turbopack build now passes and the styled production page was verified directly; do not use Webpack as an equivalent visual verification fallback without configuring its CSS pipeline. No build configuration was changed.
- Applied the requested header/footer screenshot refinement: header remains at the viewport top using sticky positioning, has anchor-scroll clearance and a prominent green Create an auction CTA. Desktop includes EN/SK and Sign in previews; the expanded menu below 1024px contains the same previews and is scrollable on short screens.
- Footer now uses compact brand/copyright on the left and the requested Terms/Privacy/Status/Documentation labels plus language preview on the right. Resources are disabled and marked “Coming soon”; EN/SK and Sign in are also disabled and visibly marked as forthcoming. No new routes, fake service-status signal, authentication or localization was implemented.
- Scope assumption: continued the existing UI-only milestone while asking whether actual localization and Clerk authentication are desired; that clarification has not yet been answered. Functional translations/sign-in remain a separate task, not completed work.
- Synchronized Features 02, 03 and 05 plus UI context with the header/footer refinement. Verified final changes with ESLint, standalone TypeScript, default Turbopack production build and `git diff --check`. Chrome checks at 375/768/1280/1440px confirmed sticky header top=0 after scrolling, no horizontal overflow, working mobile menu, disabled preview semantics and matching header/footer backgrounds. Inspected mobile and desktop screenshots in `/tmp/qrbid-header-footer-375.png` and `/tmp/qrbid-header-footer-1440.png`.

- Feature 06 was explicitly approved for implementation on 2026-11-07. Added `/auctions/new` with a single Terra form card, auction details, paired pricing fields, duration controls, accurate unlisted-auction information and disabled action row. Reused Button, Input, Textarea, Card and the shared footer; no dependencies were added.
- Local photo selection and drag/drop support JPG/PNG/WebP, thumbnail previews, filenames, sizes, unsupported-type feedback and removal. Object URLs are revoked on replacement/unmount. No uploads or persistence occur.
- Date/time initialize after mount to browser time plus 72 hours. Quick choices set local date/time; manual changes clear the selected duration and update the English summary. The time-zone label comes from the browser, with no fixed CEST or historical date.
- Header uses `usePathname()` to hide its creation link only on `/auctions/new`, in desktop and mobile navigation. Existing three home CTA links already used the correct Next.js Link destination and needed no changes.
- Verification: `npm run lint`, `npm run build` (default Turbopack), `npx tsc --noEmit` and `git diff --check` passed. Reviewed applicable React best practices and installed Next.js usePathname documentation.
- Production Chrome checks at 320/375/390/768/1280/1440px found no horizontal overflow, one h1/footer, mobile stacking and paired desktop pricing fields. Visually inspected full-page 375px and 1440px screenshots at `/tmp/qrbid-feature06-375.png` and `/tmp/qrbid-feature06-1440.png`, including paired date/time fields and opposite-end desktop actions.
- Browser checks confirmed +7-day selection, manual date summary updates, a decoded local PNG preview, unsupported file rejection, photo removal, mobile menu expansion with Home retained and creation CTA absent, three home creation links, disabled non-submit actions, labels on all fields and a visible 2px keyboard focus ring. No runtime exceptions were observed. Local CDP access required sandbox escalation; verification then completed successfully.
- Remaining scope: this is English UI and local state only. Draft saving, auction publishing, QR/PDF generation, authentication, backend validation and persistent uploads remain unavailable by design.
- Fixed the reported Feature 06 development hydration mismatch in SiteHeader: pathname-dependent CTA visibility now waits for hydration via `useSyncExternalStore`, with the same CTA-free server and initial client snapshot. The rest of the shared header renders normally; no hydration warnings are suppressed. After hydration the creation CTA appears on home and remains hidden on `/auctions/new`.
- Hydration-fix verification: ESLint, default Turbopack production build, standalone TypeScript and diff checks passed. On the existing development server at port 3000, Chrome at 375px and 1440px confirmed direct visits to both routes and Next.js Link navigation from home to the form, with correct CTA visibility and no browser runtime/console errors. A separate dev server was not used because Next.js detected the existing instance.
- Applied the requested compact photo-picker styling: centered Choose photos control backed by the native file input, reduced vertical padding/icon spacing and smaller 14px action/12px supporting text. Native file selection and drag/drop remain available, with a visible focus outline on the browse label when the input receives keyboard focus. ESLint, standalone TypeScript and diff checks passed; Chrome checks at 375/1440px confirmed centered alignment, 216/208px drop-area height, keyboard focus and no horizontal overflow. Production build was not repeated for this focused styling change.
- Moved the header language preview to the far right, after navigation actions, with the same left divider and spacing as the footer. Expanded mobile navigation places it at the right of the final Sign in row. Updated UI context. ESLint, standalone TypeScript and diff checks passed; Chrome at 375/1440px confirmed final/right-aligned position, a 1px divider, no overflow and no runtime exceptions. Production build was not repeated for this layout-only adjustment.
- Feature 09 follows the approved frontend-only specification. `AuctionCardSkeleton` is presentation-only and receives one localized accessibility description; all visible skeleton geometry is `aria-hidden`. The visual All/Active/Ended control uses non-interactive text and explicitly announces that filtering is unavailable in this feature.
- The signed-in desktop Edge review used the existing local development session at `/en/my-auctions`. It confirmed the protected page content and signed-in navigation without changing account state. The production server on port 3100 independently confirmed localized signed-out redirects and the public landing response.
- Applied product-owner screenshot feedback to Feature 09: the visual page title moved into the top bar beside QRBid, while a screen-reader-only `h1` remains in the main content. Summary cards now use the reference Radio, Banknote and QR icons with a small label, larger bold value and small right-side meta text. The approved static EN reference content is `3 Active QR Assets / Real-time`, `€645.00 / 40 total bids` and `82 Direct Scans / Print Posters`; these values are explicitly UI-only and not calculated analytics.
- Applied the requested Feature 09 typography refinement across all three summary cards: reduced the small labels and right-side meta text to 11px, and reduced the bold values to 16px on mobile and 18px from the small breakpoint. Card structure, icons, content and responsive layout are unchanged.
- Shortened the first Slovak summary card to `Prebiehajúca aktivita / 3 aktívne aukcie / V reálnom čase`. Added the pointer cursor to interactive EN/SK language buttons while preserving the waiting cursor during a pending locale transition.
