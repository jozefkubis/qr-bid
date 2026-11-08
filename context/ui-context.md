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

### Create Auction

Single-column form: title, description, photos, starting price, minimum increment, end date/time. Clearly show the local time zone. Do not implement Save Draft unless separately approved.

### Auction Detail (Mobile Priority)

Show image, title, description, current highest bid, countdown, minimum valid next bid, clear Place Bid action, and a readable bid history. Visitors may view without signing in; authentication is required to submit a bid. Keep contact information private. The screenshot's quick-increment controls are a proposed UX convenience, not yet an approved bidding rule. A sticky mobile bid bar is optional and must not obscure content.

### Auction Published / QR Sharing

Show auction URL, QR code, Copy Link, QR download, A4 PDF poster download, and View Auction. QR output must be scannable and lead to the correct auction URL.

### My Bids

Show auctions the user participated in, their latest bid, current highest bid, and active/ended status. Do not include win-rate analytics, invoices, or claim workflows in MVP.

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
- Header includes a working EN/SK switcher, working Clerk authentication controls, and a prominent green Create an auction action. Signed-out authentication opens Clerk's localized modal; signed-in users see Clerk's account avatar.
- The header language switcher follows the navigation actions and is separated by the same slim vertical border used in the footer. Its active locale is visually highlighted and exposed through `aria-pressed`; both controls meet the 44px touch-target guidance. When signed in, Clerk's user avatar sits immediately after EN/SK as the final item on the far right. The expanded mobile menu uses the same EN/SK-then-account order below the creation link.
- Footer follows the compact reference layout: brand/copyright left, planned resource labels and language preview right on desktop; wrap/stack on mobile. Terms, Privacy, Status and Documentation are disabled and marked “Coming soon”, with no fake routes or operational-status claim. Background remains identical to SiteHeader.
