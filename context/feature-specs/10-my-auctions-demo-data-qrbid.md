# Feature 10 — My Auctions: Demo Data & Interactive UX

**Project:** QRBid  
**Status:** Approved frontend-first feature specification for Codex  
**Prerequisite:** Feature 09 — My Auctions UI  
**Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS, Clerk, next-intl  
**Design:** Existing Terra design system  
**Scope:** Local demonstration data and functional My Auctions interactions only

## 1. Objective

Replace the two ghost auction cards from Feature 09 with realistic auction cards powered by **local, clearly fictional demo data**. Preserve the screenshot-inspired design: wide cover photo, status and remaining-time badges, title and location, three-column bid summary, and two prominent actions. Make All / Active / Ended filters functional and show a live countdown. No database, server mutations, bidding or QR generation in this feature.

This is a UX prototype, not a live auction platform. The purpose is to validate the My Auctions experience before Feature 11 (auction detail and editing prototype) and Feature 12 (Supabase integration).

## 2. Before implementation — inspect and report

Inspect the **actual local working tree**, including:
- `app/[locale]/my-auctions` (or actual route), current Feature 09 implementation and ghost cards;
- `components/layout/site-header.tsx`, existing Clerk authorization, `proxy.ts`;
- `messages/en.json`, `messages/sk.json`, `i18n/navigation.ts`;
- Terra tokens, shared UI primitives, `next.config.ts` and image handling.

Report a brief, concrete file-change plan **before editing**. Do not duplicate existing components or overwrite unrelated work. If Feature 09 is missing locally, stop and ask before proceeding.

## 3. Local demo data

Create a small, typed module such as `data/mock-auctions.ts` (adjust path to project conventions) with **exactly four fictional auction records**:
- **3 active** auctions;
- **1 ended** auction.

Each record should have a stable demo ID, title, short location/description, cover image reference (if a suitable local asset is available), currency, starting price, optional current highest bid, bid count, start/end timestamps, and an explicit demo status if needed. Include fields only if used by the UI. Avoid building an elaborate domain layer prematurely.

Use clearly illustrative values, not real user information, real addresses, actual parking-space identifiers, or claimed QR scan measurements. Keep the auction titles as user-generated-like sample content, **not automatically translated**; all surrounding interface copy must be localized.

Use safe local images already in the repository if suitable. If none exist, use neutral Terra image placeholders rather than hotlinking arbitrary images or installing an image service. **Do not use screenshots supplied in chat as production assets without explicit instruction.**

Avoid data that instantly expires: define stable future/end times for UX demonstration or compute relative dates from a fixed, documented demo configuration. Ensure the ended item is always visibly ended during normal testing. Do not pretend the countdown is a real server-authoritative auction timer.

## 4. Auction card layout

Keep the visual hierarchy shown in the supplied screenshot:

1. **Wide cover image area** with subtle rounded top corners; status badge at top-left and time badge at top-right.
2. **Auction title** (maximum two visible lines), compact location line.
3. **Three-column summary:** Current Highest, Total Bids, Starting Price.
4. **Two equal-prominence action areas:** `View & Share QR` and `Auction Details`.

For auctions with zero bids, show localized **No bids yet** instead of inventing a highest offer. Format EUR currency and date/time appropriately for the current locale. Handle missing cover images gracefully. Avoid layout shifts and horizontal overflow. On narrow screens stack or wrap action areas appropriately.

### Action behavior in Feature 10

- `Auction Details`: Feature 11 will implement the actual detail route. In Feature 10, render it as a **clearly disabled/coming-soon control**, with a localized explanation; do not navigate to an invented route.
- `View & Share QR`: also **disabled/coming soon** until the QR feature is specified and implemented. Do not display a fake working QR code or fabricated scan URL.
- Do not use clickable controls with empty event handlers. Disabled controls must remain accessible and visibly disabled.

## 5. Working All / Active / Ended filters

- Make the existing Feature 09 segmented filter functional using local client-side state.
- All shows 4 records, Active shows 3, Ended shows 1 (unless the demo configuration explicitly updates a status with time).
- Show counts in labels if they fit the existing UI: `All (4)`, `Active (3)`, `Ended (1)`.
- Highlight the selected filter with Terra styles; support keyboard and screen readers (`aria-pressed` or appropriate tabs semantics).
- Filter changes must not trigger a full-page reload or mutate demo data.
- Provide a small localized filtered-empty-state component only if needed; do not confuse it with the **real account empty state**, which is deferred to Feature 12.

## 6. Countdown and status

- Display a readable countdown for active auctions, e.g. `3h 42m remaining`, with localized units and labels.
- Ended auctions show `Ended` and, if useful, the end date instead of a negative countdown.
- Use the client clock for **visual demo purposes only**. Keep implementation lightweight, avoid hydration mismatches, clear any intervals on unmount, and update at a reasonable cadence (e.g. once per minute or once per second only if seconds are actually displayed).
- The countdown must not grant bidding rights, change server data or pretend to be a source of truth.
- Ensure accessible announcements are not repeated every second.

## 7. Summary cards — remain honest about demo metrics

Preserve Feature 09's three summary cards:
1. Live Bidding Activity
2. Finished Bidding
3. Physical Scans Today

For the first two, counts may derive from the **four local demo records**, but must be visibly labeled as demo/sample data. For Physical Scans Today, keep `—` / `Not available` rather than fabricating scan tracking. **No Real-time badge** unless a real Realtime source exists. Do not calculate monetary totals or invent additional analytics.

## 8. Localization

Use existing `next-intl` catalogs (`messages/en.json`, `messages/sk.json`) for all interface text: filters, statuses, countdown units, summaries, button labels, disabled explanations, demo indicator, empty/error placeholders and accessible labels. Keep translation key parity. Do not translate mock auction titles as though they were application UI; they represent sample user content.

Keep localized routes `/en/my-auctions` and `/sk/my-auctions`, language switcher behavior, Clerk auth and Terra typography intact.

## 9. Architecture and future migration

Prefer a small typed `DemoAuction` model and a presentational `AuctionCard` component with explicit props. Avoid coupling the card to the mock data module so it can later accept database-backed data. Keep client-side state only where needed for filters and countdown.

**Feature 11** will add the auction detail UX, with ability to add, edit and delete demo fields; agree separately whether changes persist in local state or browser storage. Do not implement that behavior now.

**Feature 12** will introduce Supabase schema, Clerk identity mapping, RLS, image storage, real user auctions, true account empty state and safe server-side mutations. Do not begin this work in Feature 10.

## 10. Explicitly out of scope

- Supabase, database tables, RLS, Clerk-to-Supabase mapping, API endpoints, server actions for auctions;
- creating, saving, editing or deleting auctions;
- real bids, Realtime subscriptions, QR code generation, scan tracking, email notifications;
- actual auction detail pages, new dashboards or analytics;
- new libraries without a clearly justified need;
- changing `.env.local`, secrets or authentication configuration.

## 11. Suggested implementation steps

1. **Audit and plan:** inspect Feature 09 and report exact proposed files.
2. **Typed demo data:** add four fictional records and verify status/counts.
3. **Card UI:** replace ghosts with responsive screenshot-inspired cards, keep disabled future actions.
4. **Interactive UX:** implement filters, countdown, honest summary indicators.
5. **Localization and QA:** translate new UI, test EN/SK, desktop/mobile, auth protection and countdown cleanup.

After each step verify behavior before continuing. Ask for approval if an architectural decision or substantial scope change is needed.

## 12. Acceptance criteria

- [ ] Existing Feature 09 layout and Terra design are preserved.
- [ ] Four clearly fictional demo auctions render (3 active, 1 ended).
- [ ] Cards have wide media, status/time, title/location, summary and two future-action areas.
- [ ] No invented user data, working QR URLs, real-time claims or scan counts.
- [ ] All / Active / Ended filters work without page reload.
- [ ] Active countdown displays sensibly; ended auction has no negative timer.
- [ ] Summary cards use demo-derived counts or unavailable values with clear labeling.
- [ ] No-bids case is handled without fake highest bid.
- [ ] Both EN and SK interface translations work, with matching catalog keys.
- [ ] Desktop and mobile layouts are responsive and accessible.
- [ ] Clerk protection, navigation and language switching remain intact.
- [ ] No Supabase, API, persistence, new dependencies or unrelated refactors.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` run; actual results reported.
- [ ] Manual UX tests documented: All/Active/Ended, EN/SK, signed-in access, mobile and expired countdown.

## 13. Codex execution instructions

This document defines the **approved Feature 10 scope**, not authorization to push or commit. First inspect the current project, summarize a concise file plan, and implement only after the user authorizes implementation. Keep changes small, readable and reversible. Do not touch GitHub or Supabase without explicit approval. At the end report changed files, actual validation outcomes and any deferred items for Feature 11/12.
