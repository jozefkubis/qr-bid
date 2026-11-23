# QRBid – UI Context (Approved Visual Direction v1.0)

## Design Direction

QRBid should feel calm, trustworthy, modern, and easy to use. The Google Stitch screenshots are visual references, not a mandate to implement every visible feature. Prioritize a minimal mobile-first auction experience over decorative dashboards.

**Status:** Approved by the product owner. Terra (warm cream and forest green) is the definitive QRBid visual direction. Do not use the previous purple-and-white direction.

## Approved Design Tokens

Based on the supplied `DESIGN.md` (Terra — Organic Design):

| Role | Approved value | Usage |
| --- | --- | --- |
| Primary | `#4a7c59` | Primary actions and interactive states |
| Background | `#faf6f0` | Warm cream page background |
| Tertiary | `#705c30` | Restrained secondary accents |
| Headings | Literata | Headings only |
| Body | Nunito Sans | Body, labels, forms |
| Soft shadow | `0 4px 20px rgba(46, 50, 48, 0.06)` | Subtle elevation |

Use CSS variables in `globals.css` and map them to Tailwind theme utilities. Keep components free of repeated hardcoded colors. Implementation details such as token names, accessible text colors, focus/hover states, and contrast checks will be refined during UI implementation without changing the approved visual direction.

## Layout and Components

- Use warm neutral surfaces, white or cream cards, soft borders, and generous whitespace.
- Use a consistent radius near 12px for buttons, cards, and inputs; refine by component only when needed.
- Primary buttons are solid accent color; secondary buttons are outlined or lightly tinted.
- Active QRBid controls use a brief `scale(0.98)` press response and return to `1` on release. The shared rule covers buttons, button-styled links, file-picker labels and supported Clerk controls; disabled/loading controls and reduced-motion mode never transform.
- Keep navigation short: My Auctions, My Bids, Create Auction, Profile, EN/SK switch.
- Use clear labels, inline validation, and large touch targets (aim for at least 44 × 44 CSS pixels).
- Use consistent loading, empty, error, active, and ended states.
- Avoid unnecessary charts, metrics, promotional panels, and complicated sidebars.
- UI supports English and Slovak; allow space for longer translated labels.

## Screen Guidance

### Landing Page

Short hero, clear Create Auction action, and a simple three-step explanation. No public auction marketplace.

### My Auctions

Simple auction cards: image, title, status, current highest bid, time remaining, and links to details and QR sharing. No scans analytics or combined-value dashboard widgets in MVP.

#### Feature 15 finalization management (2026-11-20)

- An ended real auction adds a protected finalization panel to its existing owner detail. It presents the authoritative result state without implying that confirmed interest is an automatic legal sale.
- Only after `interest_confirmed` or `sale_completed`, the panel shows the current confirmed bidder's server-verified name and e-mail. It never exposes phone, another candidate, or contact data on the public auction detail.
- In `interest_confirmed`, the owner may explicitly record sale completion or continue with the next ranked candidate after a withdrawal. Both are authenticated Server Actions backed by locked database transitions.

#### Feature 09 visual refinement (2026-11-12)

- Signed-in **My Auctions / Moje aukcie** sits in the top bar directly beside the QRBid brand; the page keeps a semantic heading but does not repeat a large visual title in the content.
- The three Feature 09 summary cards are compact reference-only UI: a circular Lucide icon, a very small label, a restrained bold value, and a very small right-aligned meta label. Their typography stays visually light and must not increase the compact card height. Their approved static values are not database-backed analytics and must be replaced by verified owner-scoped data in Feature 10.
- This focused visual preview does not approve a broader analytics dashboard or QR scan tracking implementation.

#### Feature 10 demo-data refinement (2026-11-12)

- Replace the two layout-only ghost cards with exactly four clearly fictional local demo auctions: three active and one ended. Sample auction titles remain unlocalized user-content examples; all surrounding interface copy is localized.
- With no suitable local image assets, use fixed-height neutral Terra media placeholders with accessible descriptions. Do not hotlink images or reuse chat screenshots as production assets.
- Cards show localized status/countdown badges, title, compact location, current highest bid or a no-bids state, bid count, starting price, and two equally prominent disabled future actions with visible explanations.
- All / Active / Ended is a keyboard-accessible client-side filter with counts. The visual countdown updates once per minute from a client-only demo clock and is not authoritative auction timing.
- Summary cards derive active/ended counts only from the four demo records, label them as demo data, and keep physical scans unavailable. No Realtime claim, scan count or monetary aggregate is shown.

### Create Auction

Single-column form: title, public free-text location, description, photos, starting price, minimum increment, end date/time. Location is one required international text input rather than a country/city dropdown or address autocomplete; its helper text explains that the value is publicly displayed. Clearly show the local time zone. Do not implement Save Draft unless separately approved.

#### Feature 12 Stage B persistence (2026-11-13)

- The primary submit action creates a private owner-scoped auction after server validation. QR generation and photo upload remain explicitly unavailable; selected photos are still local previews and are not submitted.
- My Auctions replaces demo records with owner-scoped Supabase rows, real active/ended counts derived from persisted end times and a clear first-auction empty state. QR scan analytics remain unavailable.
- A persisted auction UUID opens a private read-only owner summary. Editing, deletion, photos and public sharing remain reserved for Stage C; existing clearly marked Feature 11 demo routes continue to support their local prototype behavior.

#### Feature 12 Stage C persistence (2026-11-13)

- Create Auction submits up to five selected JPEG, PNG or WebP photos together with the validated auction. Each file is limited to 5 MB; previews remain removable before submission and now clearly state that files are ready to upload.
- A real UUID visitor route renders only the approved unlisted auction fields, persisted Storage gallery and an empty bid-history state. It does not show owner identity, profile details or contact information. Demo IDs continue to use the Feature 11 local prototype.
- The private real-auction route provides active zero-bid editing, photo upload/removal and a required irreversible-deletion acknowledgement. Ended auctions render read-only. After Stage D introduces bids, this surface must switch active auctions with accepted bids to owner-note-only behavior.
- Management photo controls place Choose photos and Upload photos side by side when space permits, wrap safely on narrow screens, and list selected filenames underneath.
- Real My Auctions cards use the first ordered persisted photo as their cover and show the public auction location. Auctions without photos keep the neutral Terra placeholder. Legacy records without a location use an explicit localized unavailable state rather than an invented value.

### Auction Detail (Mobile Priority)

Show image, title, description, current highest bid, countdown, minimum valid next bid, clear Place Bid action, and a readable bid history. Visitors may view without signing in; authentication is required to submit a bid. Keep contact information private. The screenshot's quick-increment controls are a proposed UX convenience, not yet an approved bidding rule. A sticky mobile bid bar is optional and must not obscure content.

#### Feature 11 demo-detail refinement (2026-11-13)

- Public and owner demo details share a responsive gallery, price/status overview and anonymous bid history. Mobile orders media before pricing; desktop may place them side by side. Missing photos use the Terra placeholder.
- Bid history is a compact, non-scrolling list ordered newest first. It shows only amount and localized time, with a text label on the highest bid; no bidder identity or contact data appears.
- Management remains clearly separate from the public preview. Active zero-bid records expose editable Terra fields, local photo controls and a confirmed delete action; active records with bids expose only owner updates; ended records are read-only.
- QR/share UI may expose Copy Link and a selectable absolute localized URL, but must label QR generation as unavailable and explain that local demo edits do not transfer to another browser.
- Every screen labels fictional records and history as demo content. Local session behavior must never imply persistence, ownership authorization, real bidding or Realtime updates.

#### Feature 12 Stage D bidding (2026-11-13)

- A real auction shows its public user-authored location plus its database-derived current highest amount, minimum next amount, bid count and newest-first anonymous history from one safe public response. History contains only amount and localized time.
- Before the first bid, the primary action offers exactly the starting price. Afterwards, quick actions show 1x, 2x and 3x the minimum increment and always include the resulting absolute total. A custom absolute EUR amount remains available.
- Every bid is reviewed in a separate confirmation panel displaying the full submitted amount. The confirmation keeps one request UUID for retry safety until it succeeds, is cancelled or a new amount is reviewed.
- Signed-out visitors retain the public detail and receive a localized sign-in action. The current dedicated Clerk flow returns to localized home after authentication; direct return to the auction remains a later UX refinement. Ended auctions replace controls with a closed state.
- Owner cards display real bid count/current highest. After the first accepted bid, private management hides editing, photo and deletion controls and exposes only a timestamped owner-update form while the auction remains active.

#### Feature 12 Stage E Realtime (2026-11-13)

- Every real public auction detail subscribes to its UUID-scoped public bid-change channel. A safe signal or successful reconnect refreshes the server-rendered current amount, minimum, count and anonymous history from the database-backed public response.
- Realtime never accepts or validates a bid and does not display values taken from the event payload. An outage leaves normal page loads and transactional bidding functional.
- If another accepted bid arrives while a confirmation is open, the full amount and request UUID remain unchanged. The panel displays the new database minimum and warns the bidder to review before submitting the preserved amount.

#### Feature 16 Step 1 bid confirmation (2026-11-23)

- Quick bid choices are outlined before selection. The selected absolute amount uses the Terra primary surface, a check mark and `aria-pressed`; custom amount editing clears the quick selection.
- Mobile quick choices lead with the absolute total and place the increase beneath it. The custom field follows the current database-backed minimum until the bidder edits it, then preserves the draft while continuing to show the latest minimum.
- Valid quick and custom amounts open the same modal confirmation: bottom-anchored on mobile and centered from the small breakpoint. The native modal dialog blocks background interaction, traps keyboard focus, supports Escape before submission, returns focus to its opener and keeps actions outside its scrolling content with safe-area padding.
- A pending confirmation keeps its amount and request UUID. A changed minimum never rewrites the reviewed amount; an insufficient amount must return to editing. Successful or idempotently replayed submission clears selection, resets the custom field to the server-returned minimum and announces the accepted amount plus next minimum in the panel.
- The signed-in auction owner may inspect the same amount controls, but opening the modal shows an error-colored exclamation warning and only a Back action. The server supplies only an owner boolean derived through the existing owner-scoped RLS read; the PostgreSQL `own_auction` rejection remains the authoritative protection.

### Auction Published / QR Sharing

After a real auction is created, redirect its owner to the protected localized sharing page. The first redirect confirms that the auction was published; later openings from auction management use the normal sharing heading. Show the auction title, optional public location, starting price and localized end time with its time-zone abbreviation.

Use one absolute environment-specific public auction URL for the selectable link, clipboard action, View Auction action and QR payload. Keep copy controls above the QR code on narrow screens. Render a dark Terra QR mark on white with a quiet zone and provide a PNG download. If clipboard access fails, select the link and instruct the owner to copy it manually. Missing and foreign-owned auctions return 404 through the existing owner-scoped loading boundary.

After acceptance of link and PNG sharing, provide a separate **Download A4 poster (PDF)** action. Generate one portrait A4 page in the browser only after the owner requests it. Use the localized auction title, optional public location, first auction photo when available, a large dark Terra QR code on white with a generous quiet zone, the same absolute public URL and a short localized scan instruction. Convert supported source photos to a print-safe JPEG before embedding, and keep the Unicode font embedded so EN/SK text and Slovak diacritics render correctly. A failed photo or PDF preparation must show a visible retryable error rather than silently downloading an incomplete poster.

The portrait poster keeps the real QRBid application logo at the left and a subtle localized private-auction badge at the right, followed by a thin neutral divider and a prominent left-aligned title. The page itself is white. Below the title, show compact rounded near-white Terra-tinted metadata cards for the optional location and the localized end date with its time-zone abbreviation, using centered app-style location and time icon tiles; never repeat the location elsewhere. When a photo exists, present it as one wide, low, rounded band below the metadata, using a centered crop that keeps the main subject recognizable. Without a photo, let the next section follow the metadata without a placeholder or reserved gap.

The QR section is a separate rounded, softly bordered near-white Terra panel with visible spacing from the photo or metadata. Place the prominent functional vector QR geometrically centered on white at the left with a minimum four-module quiet zone, and a short localized heading plus one factual sentence at the right. Keep the larger direct-link prompt outside its rounded card, then show the link icon and complete clickable public URL inside the card. Keep reasonable print margins and ensure the printed URL and QR encode the exact same public detail. Do not copy screenshot-only marketing badges, access claims or security labels into the poster.

### My Bids

Show auctions the user participated in, their latest bid, current highest bid, and active/ended status. Do not include win-rate analytics, invoices, or claim workflows in MVP.

#### Feature 13 first version (2026-11-17)

- Signed-in navigation places My Bids beside My Auctions on desktop and includes both destinations in the mobile menu. The protected localized route is `/[locale]/my-bids`.
- One responsive card is shown per participated auction, ordered by the caller's latest accepted bid. Its identity area includes the public user-authored location. Mobile keeps title/status/location above two side-by-side prices and the detail action below; wider layouts place media, data and action in one row when space permits.
- All Bids / Leading / Outbid / Ended filters are keyboard-operable, show auction counts and use explicit text states. Ended auctions appear only in All Bids and Ended.
- Cards use the first persisted photo or the existing neutral placeholder, link to the localized public detail and expose no bidder identity. The list is refreshed by page navigation rather than a second Realtime subscription.
- Feature 13 uses only the approved Terra palette. Selected filters, the caller's latest amount and the primary detail action use forest green; outbid may use the restrained brown tertiary accent and ended remains neutral. Every status remains understandable from text without color.
- Screenshot-approved cards use a slim state-colored left edge and a compact rounded thumbnail inside the card. At wider widths the identity, three separated data columns and detail action align in one row; mobile keeps the two prices side by side, time beneath them and the action last.

#### Feature 15 result offers (2026-11-20)

- My Bids adds a separate protected result section above the participated-auction cards. Each offer shows the user's own amount, exact database deadline with a time-zone abbreviation and an explicit textual state.
- An active offer provides Confirm interest and Decline actions. The server rechecks ownership, locks and fresh database time; the browser does not decide whether the deadline still applies.
- The owner's verified name and e-mail appear only after this bidder becomes the current confirmed candidate. E-mail delivery is only a notification path; the protected in-app offer and its original deadline remain authoritative.

### Profile

Full name, email, phone number, and preferred language (EN/SK). Avoid unsupported SMS alerts, daily summaries, and advanced session-management UI.

## UX and Product Boundaries

- Auctions are unlisted and accessible by direct URL or QR code; a link is shareable and does not imply access control.
- Avoid displaying bidder contact information publicly; winner contact disclosure follows approved product rules.
- Do not imply SMS verification, push notifications, payments, invoicing, or legal sale completion unless those features are approved.
- Use realistic example content but do not copy the screenshots' dates, sample amounts, or placeholder metrics as requirements.
- The Terra palette and Literata/Nunito Sans typography are approved. The logo and any extra controls still require review before implementation.

## Shared Header and Footer Refinement (2026-11-06)

- Keep the header visible during scrolling with sticky positioning and preserve anchor clearance. Use the expanded mobile menu below 1024px.
- Header keeps the original text `QRBid` as the linked home identity and places a small square logo slot directly to its left. The current wide `public/logo.png` is temporarily cropped to its icon inside that slot; it may be replaced later by a dedicated icon image without changing the surrounding navigation. The header also includes a working EN/SK switcher, working Clerk authentication controls, and a prominent green Create an auction action. Signed-out authentication opens Clerk's localized modal; signed-in users see Clerk's account avatar.
- The header language switcher follows the navigation actions and is separated by the same slim vertical border used in the footer. Its active locale is visually highlighted and exposed through `aria-pressed`; both controls meet the 44px touch-target guidance and use the pointer cursor when interactive. When signed in, Clerk's user avatar sits immediately after EN/SK as the final item on the far right. The expanded mobile menu uses the same EN/SK-then-account order below the creation link.
- Footer follows the compact reference layout: brand/copyright left, planned resource labels and language preview right on desktop; wrap/stack on mobile. Terms, Privacy, Status and Documentation are disabled and marked “Coming soon”, with no fake routes or operational-status claim. Background remains identical to SiteHeader.
