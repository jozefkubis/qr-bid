# Feature 04 — How QRBid Works (Landing Page Section, UI Only)

**Status:** READY FOR REVIEW — implement only after the existing landing-page hero (Feature 03) has been reviewed.

## Goal

Add a clear, visually distinct **“How QRBid works”** section immediately **below the existing hero and sample auction card** on the landing page (`/`). Use the supplied screenshot as a **layout reference**, not as an instruction to copy its purple colors, claims, or unsupported product functionality. This feature is **frontend-only**: no backend, database, auth, QR generation, notifications, or live bidding.

## Read before coding

1. Read `AGENTS.md` and all linked context documents, particularly `context/ui-context.md`, `context/code-standards.md`, `context/ai-workflow-rules.md`, `context/project-overview.md` and `context/progress-tracker.md`.
2. Review Feature 01, Feature 02 and the latest approved Feature 03, plus the **current implementation** of `app/page.tsx`, `components/layout/site-header.tsx`, `components/ui/*` and `app/globals.css`.
3. Respect the approved **Terra** design and the current structure. Do not rewrite or regress the hero, header, or existing routes.
4. If the screenshot conflicts with the approved product rules, **product rules win**. Do not invent new product decisions.

## Screenshot interpretation — what to preserve

The reference image shows a wide, centered landing-page section:

- Small uppercase eyebrow **WORKFLOW** above the heading.
- Large left-aligned heading **How QRBid works**.
- One short supporting sentence below it.
- Three equally sized cards in one desktop row, with generous gaps.
- Each card has a small circular icon at the top, a step label, a bold title, a concise explanation, and a bottom separator followed by a small supporting line.
- The cards have warm light backgrounds, rounded corners and thin borders.
- The section is visually separated from the hero above.

**Adaptation for QRBid:** Keep this information architecture, but replace the screenshot's purple accents with Terra forest green and muted warm brown. Avoid the screenshot's dense text and unsupported marketing promises.

## Visual separation from the hero — important

The user specifically wants this section to be **slightly different in background color** so the transition is clear but gentle.

- The hero uses the existing warm cream `--background` (`#faf6f0`).
- Give the entire How-it-works section a **very subtle contrasting warm neutral background** (suggested: `#f3ede4`, the existing `--surface-muted`, if it reads well against the hero).
- Use a quiet top border (`--border`) if helpful; **no thick divider**, dramatic gradient, patterned wallpaper, or saturated colored block.
- Cards should be **lighter than the section background**, using the existing `--surface` (`#fffdf9`) or equivalent token, with a soft border and at most a very subtle shadow.
- Reuse the existing CSS tokens and Tailwind theme utilities; avoid hardcoding colors repeatedly.
- The colored section background must span the **full viewport width**; its content stays in a centered `max-w-7xl` container with responsive horizontal padding.
- Use generous vertical padding (roughly 72–104px desktop, 48–64px mobile), aligned with the rest of the landing page.

## Section content — exact English UI copy

### Intro

**Eyebrow:** `HOW IT WORKS`

**Heading:** `How QRBid works`

**Supporting text:** `Three simple steps to create an auction, share it with interested people, and receive bids online.`

Do not promise zero registration for bidders, guaranteed completion times, public indexing restrictions beyond the actual unlisted model, or legally binding sales.

### Step 01 — Create your auction

- **Label:** `STEP 01`
- **Title:** `Create your auction`
- **Description:** `Add a title, description, photos, starting price, minimum bid increment, and end date.`
- **Footer microcopy:** `Set the rules for your auction`
- **Icon:** `SlidersHorizontal` or similarly simple relevant icon from the existing `lucide-react` dependency.

### Step 02 — Share the QR code

- **Label:** `STEP 02`
- **Title:** `Share the QR code`
- **Description:** `Share a direct link or place a QR code on a printed A4 poster so interested people can open your auction.`
- **Footer microcopy:** `Accessible through a direct link`
- **Icon:** `QrCode` from `lucide-react`.

### Step 03 — Receive bids

- **Label:** `STEP 03`
- **Title:** `Receive bids`
- **Description:** `Registered participants can place bids online. Follow the current highest bid and see when the auction ends.`
- **Footer microcopy:** `Bidding updates in real time`
- **Icon:** `BellRing` from `lucide-react`, approved by the product owner to match the reference bell.

**Content accuracy:** Viewing an unlisted auction does not require login, but bidding does. Do not say that everyone can bid anonymously. Do not claim that the winner is automatically notified, that a sale is completed, or that any specific time window (e.g. “1 hour to 7 days”) is supported until those behaviors are implemented and approved. The three steps explain the intended product, not current working backend functionality.

## Card anatomy and layout

Build three cards with a consistent internal layout:

1. Top: circular icon container, lightly tinted Terra green, icon in accessible forest green.
2. Small uppercase step number in muted green or warm brown.
3. Title in **Literata**, clearly legible (roughly 20–24px desktop).
4. Description in **Nunito Sans**, with comfortable line height and muted text color.
5. Bottom: a subtle divider and a compact footer line with a small decorative icon: `Clock` for Step 01, `Printer` for Step 02, and `Zap` for Step 03 (approved screenshot refinement). Use `mt-auto` or equivalent to align the footers across cards even when description lengths differ.

Keep all three cards the same height on desktop. Use approximately 20–28px spacing between cards. Avoid exaggerated shadows, huge icon badges, decorative QR images, and extra actions inside the cards. These are **informational cards**, not clickable controls.

## Responsive behavior

- **Desktop (>= 1024px):** three equal-width cards in one row (`lg:grid-cols-3` or equivalent).
- **Tablet (~640–1023px):** a clean layout; one column or two columns with the third on a new row is acceptable if it looks balanced. Prefer simplicity over forced narrow cards.
- **Mobile (< 640px):** one card per row, full available width, readable text, comfortable padding and no horizontal overflow.
- Intro text remains left-aligned and constrained to a readable width. Icons and text must not be clipped.
- The section must begin **after** the hero content in normal document flow, not overlap the sample auction card or use absolute positioning to compensate for layout bugs.

## Implementation constraints

- Use **Next.js App Router, React, TypeScript, Tailwind CSS** already in the repository.
- Reuse the existing `Card` component if suitable; extend it minimally only if necessary and without breaking existing usage.
- Use `lucide-react` already installed; do not add dependencies.
- Prefer a simple static server component (`components/landing/how-it-works.tsx` or an equivalent existing convention), then render it on `/` below the hero. No `"use client"` needed.
- Static content can be written directly as three typed objects or simple JSX. **No fake API, no fetching, no timers, no client state**.
- Preserve existing `SiteHeader`, hero section, sample auction card, links and their approved behavior.
- Do not introduce shadcn/ui, animations, sliders, dashboards, sign-in flows, language switching, or other new routes.
- English only for now; keep text straightforward for future EN/SK localization.

## Explicitly out of scope

- Actual auction creation, uploads, QR rendering, poster/PDF export.
- Real-time subscriptions, bidding, validation, countdown logic, bid history, winner selection.
- Clerk, Supabase, Resend, database changes, server actions and API routes.
- Pricing, testimonials, FAQ, marketplace listings, extra marketing sections.
- Modifying the header or redesigning the Feature 03 hero.

## Acceptance criteria

- [ ] `How QRBid works` appears **directly below** the existing landing-page hero.
- [ ] The section has a **subtle, full-width warm neutral background**, visibly but gently distinct from the hero.
- [ ] Three cards match the screenshot's **layout hierarchy** and use Terra colors, not purple.
- [ ] Desktop at 1280px and 1440px shows all three cards in one row.
- [ ] Mobile at ~375px shows one card per row, with no horizontal scrolling.
- [ ] All headings, descriptions and footers match the approved copy above.
- [ ] No misleading claims about anonymous bidding, automatic sales, guaranteed times or implemented functionality.
- [ ] Existing hero remains two-column on desktop (left text, right sample auction), and header still works.
- [ ] Semantic structure (`section`, `h2`, `h3`) is correct; icons are decorative (`aria-hidden`) when adjacent text conveys meaning.
- [ ] No new dependencies, API calls, backend integration or functional bidding.
- [ ] Run existing lint, TypeScript/build checks where available; report exact results.
- [ ] After implementation and verification, update `context/progress-tracker.md` accurately; do not mark incomplete tasks done.

## Delivery

Implement only this section in a small, reviewable change. Summarize changed files, what was verified, and any remaining issues. **Stop for review before starting another feature.**
