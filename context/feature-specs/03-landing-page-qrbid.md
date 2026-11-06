# Feature 03 — QRBid Landing Page v3 (Two-Column Hero + Static Auction Preview)

**Status:** Implemented; awaiting visual review. Updated from the product-owner screenshot feedback on 2026-11-06.  
**Scope:** Rebuild the landing page at `/` to match the intended **side-by-side desktop composition**. Frontend-only; no backend or real bidding.

## 0. Read before implementing

Read `AGENTS.md` and the context files it references, especially:

- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/project-overview.md`
- `context/feature-specs/01-design-system-qrbid.md`
- `context/feature-specs/02-public-pages-qrbid.md`
- `context/progress-tracker.md`
- `DESIGN.md`

Inspect the current `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/layout/site-header.tsx` and `components/ui/*` before editing. Reuse existing UI primitives and design tokens. **This feature supersedes the landing-page implementation instructions from Feature 02 and the previous Feature 03 only where they concern the landing page.** It does not supersede the separate Create Auction page requirements.

## 1. Problem to fix (based on the supplied screenshots)

The reference shows a desktop marketing hero divided into **two simultaneous columns**. The supplied two screenshots are separate captures of the **left and right parts of the same intended desktop hero**; they are **not two sections to stack vertically on desktop**.

### Left screenshot — observed elements

- Warm, very pale page background with an extremely subtle dot pattern.
- At the top, a header with logo and navigation; this is shared site chrome, not part of the hero content.
- A small eyebrow/badge above the headline (original reference text: “Simple, Private QR-Powered Bidding”).
- Large, three-line headline: “Create an auction. / Share a QR code. / Get bids.” The final line is purple in the reference.
- Supporting paragraph explaining link-only, time-limited auctions.
- Two horizontal CTA buttons: filled “Create Auction” and outlined “View Sample Auction”.
- Thin divider and a compact trust/information line below the buttons.

### Right screenshot — observed elements

- A large white auction card with rounded corners, soft shadow, and subtle border.
- Top status badge (“Live Micro-Auction”), parking-space title and location line.
- Small QR graphic at top right.
- Horizontal information strip showing current highest bid and time remaining.
- “Quick increment” row with three pill-like amount choices.
- Input-like field for a custom bid amount.
- Wide prominent “Place … Bid Instantly” button.
- Bottom divider and a line indicating private URL and number of bids.
- Floating notification bubble above the card (“New bid … 2m ago • Auto-validated”).

**Important:** The screenshots use purple buttons and accents, serif body text, a live-looking notification, and claims of validation. These are **visual reference only** and conflict with QRBid's approved Terra system or the frontend-only milestone. Do not reproduce them literally.

## 2. Approved QRBid visual rules (non-negotiable)

- Primary green `#4A7C59`; page background cream `#FAF6F0`; restrained amber `#705C30`.
- Headings **Literata**; body, buttons, labels and supporting text **Nunito Sans**.
- Light theme only. Warm white/cream cards, subtle borders and shadows, generous spacing, soft ~12px radii (do not imitate oversized purple pills indiscriminately).
- Use existing CSS variables / Tailwind tokens from Feature 01; avoid hardcoded duplicate brand colors.
- Use `lucide-react` sparingly; no shadcn/ui, Radix, animation packages, new component library, or unnecessary dependencies.
- Mobile-first, semantic HTML, keyboard-visible focus, accessible contrast, minimum ~44px touch targets.
- English copy for now. The later shared-header refinement in Feature 02 permits a disabled language-preview control marked “Soon”; working localization remains out of scope.
- QRBid is an **unlisted/link-only auction tool**, not a public marketplace. Viewing an auction does not require registration; bidding eventually will.

## 3. Primary desktop layout — the highest-priority acceptance criterion

At a normal desktop width (e.g. **1440px**), immediately below the existing `SiteHeader`, render **one hero section containing two columns in the same row**:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Existing SiteHeader (shared; do not rebuild)                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LEFT — hero copy (~53–56%)             RIGHT — preview (~44–47%)             │
│                                                                              │
│  [small eyebrow badge]                  ┌───────────────────────────────┐     │
│                                        │ Sample Auction · Preview only │     │
│  Create an auction.                    │ Parking Space #42             │     │
│  Share a QR code.                      │ ...                           │     │
│  Get bids.                             │ Highest bid | Time remaining  │     │
│                                        │ Suggested amounts (static)    │     │
│  One short explanatory paragraph       │ Custom amount (demo only)     │     │
│                                        │ [Bidding unavailable]         │     │
│  [Create Auction] [View sample]         │ Direct-link access · 14 bids  │     │
│                                        └───────────────────────────────┘     │
│  Small factual supporting line                                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Use a **single centered max-width container** (`max-w-7xl` or similar) shared by both columns, with comfortable horizontal gutters and a `gap` around 48–80px on large screens.
- Use a responsive CSS grid (`lg:grid-cols-...`) or flex layout that explicitly switches to **two columns at a suitable breakpoint**. The hero text and auction card **must appear side by side** at 1280px and 1440px viewport widths.
- Suggested ratio: left 55%, right 45%; adapt for legibility and card minimum width. **Do not place the preview below the hero on desktop** and do not use a separate full-width section for it.
- Vertically align the two columns around the center of the hero; avoid an excessive empty gap between header and content.
- Hero should feel like a single coherent first-screen composition. Do not set fixed heights that clip content on shorter laptops.
- The reference's dotted background is optional and must remain extremely subtle; prefer a plain cream background over visual noise.
- No absolute-positioned major columns; no horizontal overflow.

### Responsive behavior

- **Large desktop ≥ ~1024px:** two columns in one row. Left hero and right card both visible without horizontal scrolling.
- **Tablet / narrow widths:** allow columns to stack **only when the card would become too narrow**. Choose breakpoint based on actual content width, not an arbitrary visual effect.
- **Mobile (e.g. 375px / 390px):** one column: eyebrow → headline → paragraph → CTA(s) → supporting line → auction preview card. Reduce headline size, allow CTA wrapping/stacking, keep card within screen with comfortable padding. Do not shrink text to fit or crop the preview.
- Verify 375px, 768px, 1280px, and 1440px layouts. Screenshots at desktop and mobile are part of review.

## 4. Left column — exact content and behavior

### 4.1 Eyebrow

Small understated badge with a simple icon if useful:

**“Simple auctions. Shared by QR.”**

Do not use the original purple gradient/badge. No claims about verified participants or automated validation.

### 4.2 Main heading

Use a single semantic `<h1>` with these three lines on desktop:

**Create an auction.**  
**Share a QR code.**  
**Get bids.**

- First two lines in standard dark heading text.
- “Get bids.” in approved **primary green**, not purple.
- Literata; strong visual hierarchy; responsive sizing and line-height. On mobile, wrapping can adjust naturally.
- Do not create three separate `<h1>` elements.

### 4.3 Supporting paragraph

Use short, plain English:

> Create a time-limited auction, share its link or QR code, and let interested people place bids. No public marketplace required.

This describes the planned product without implying that backend features already work.

### 4.4 CTAs

- Primary **“Create an auction”** → Next.js `Link` to `/auctions/new`, using existing green primary Button styling (or equivalent Link styling consistent with the primitive). Route may still be a UI-only prototype.
- Secondary **“View sample auction”** → `#sample-auction`, the static preview card in the same hero. Include an understated eye icon; the primary CTA may include an arrow icon. No separate sample route is required.
- The sample CTA scrolls to the on-page preview; it must not link to an unimplemented auction detail route.
- Both controls have accessible focus and mobile-sized targets.

### 4.5 Small supporting line

Under a subtle divider, use short factual text, e.g.:

**“View auctions without signing in · Share via a direct link or QR code”**

Do not promise instant QR generation or email verification as already deployed. Do not imply the app currently handles real bids.

## 5. Right column — static demo auction card

Create a **presentational auction preview** using hardcoded local data, not an actual auction detail page. Reuse the existing `Card` and `Button` components where appropriate. If useful, extract one small `components/landing/auction-preview-card.tsx` component; avoid unnecessary component hierarchy.

### 5.1 Sample data (explicitly fictional)

Keep the values in one small local constant/object, not scattered through JSX:

```ts
const sampleAuction = {
  title: "Garage parking space #42",
  location: "Bratislava, Slovakia",
  startingPrice: 100,
  currentBid: 145,
  minimumIncrement: 5,
  suggestedBids: [150, 155, 170],
  bidCount: 14,
  timeRemainingLabel: "4h 12m",
  currency: "EUR",
} as const;
```

- These are **display-only example values**, not live data, product defaults, or validated business rules.
- EUR is provisional display currency, not a decision about international currency support.
- No real user names or bidder identities; no location more specific than city/country needed for the example.

### 5.2 Card header

- Small, clear label **“Sample auction · Preview only”** (visually distinct, always visible).
- Title **“Garage parking space #42”**.
- Supporting line **“Bratislava, Slovakia”**.
- Optional small **decorative QR motif** in the top-right, clearly labeled **“Illustration”** or omitted. **Do not create a fake scannable QR code** and do not imply that it links to an existing auction. Actual QR generation belongs to a later feature.
- No “Live Micro-Auction” badge, no “Auto-validated” claims, no floating “New bid by Martin K.” notification; these would falsely imply real activity.

### 5.3 Price and time summary

A warm, lightly tinted strip containing two information groups, side by side on sufficiently wide cards:

- **“Current highest bid”** → **“€145”**.
- **“Time remaining (example)”** → **“4h 12m”**.

Use a static string for remaining time. **No timer, `setInterval`, hydration-sensitive time math, date calculations, or server calls.** If space is limited, stack these groups cleanly.

### 5.4 Suggested bid amounts (visual only)

Show a label such as **“Example next bids · Minimum +€5”** and three compact suggestion chips:

- `+€5 (€150)`
- `+€10 (€155)`
- `+€25 (€170)`

Arrange the three chips in an equal-width row, allowing text to wrap on narrow screens. A small location icon may accompany the city/country. These are **static labels**, not active bidding controls. Prefer `<span>` or non-interactive elements styled as chips, rather than buttons that appear functional. No click handlers or selected states.

### 5.5 Custom amount and bid action (visual only)

- A clearly labeled amount example, e.g. **“Your bid (example)”** with a read-only input-like presentation showing **“€150”**. It must not submit or pretend to accept bids.
- Prominent green full-width disabled button **“Bidding available after launch”** (or **“Demo only — bidding disabled”**). Use native `disabled` semantics and readable disabled styling.
- **No actual `Place Bid` active button**, no form submission, no fake success, no mock database calls.

### 5.6 Card footer

Subtle divider, then:

- Left: **“Unlisted · Accessible by link”** (avoid “private URL” because unlisted is not secure access control).
- Right: **“14 example bids”**.

Do not reveal participant names, contact details, winner information, or invented notifications.

## 6. Page end — Feature 03 scope

**Subsequent approved extension:** Feature 04 (`04-how-it-works-qrbid.md`) now adds its own How QRBid Works section below this hero. Preserve the sample CTA and hero behavior; the hero-only restriction below describes the Feature 03 milestone, not the page after Feature 04.

The product owner explicitly removed the lower “How it works” section on 2026-11-06. End the page after the two-column hero and its preview card. Do not render the three-step explanation, an extra divider, or a broken `#how-it-works` link. This supersedes Feature 02’s landing-page explanation requirement.

## 7. Header: reuse, do not redesign

- Use existing `SiteHeader` already rendered from `app/layout.tsx`.
- Do not add a second navbar inside `app/page.tsx`.
- Do not copy the reference's broken logo image, purple Create Auction button, Sign in link, or EN/SK switcher into the hero.
- The shared header follows the latest Feature 02 header requirements, including the subsequent sticky position and explicitly disabled language/sign-in previews. Preserve its working navigation.
- Do not introduce authentication or fake language switching.

## 8. Technical scope and guardrails

**Allowed:** JSX/TSX layout, static local demo object, Tailwind classes, existing UI primitives, Next.js `Link`, lucide icons, minor metadata correction if necessary and approved by existing project standards.

**Not allowed:** Supabase queries, Clerk, API routes, server actions, localStorage, data persistence, file uploads, actual bidding, realtime, countdown timers, QR generation, PDF generation, email, dynamic bidder notifications, mock network services, new dependencies, new auction routes, or global refactors.

- Prefer a **Server Component** for the landing page and demo card; no `"use client"` unless a genuinely required interaction already exists in a shared component.
- Preserve existing component props, CSS tokens, routes and header functionality.
- Avoid changing the Create Auction page in this feature.
- Use only local dummy data and clearly mark preview-only elements.
- Do not modify unrelated files.

## 9. Implementation sequence

1. Inspect existing files and confirm current header, tokens, and Feature 01 primitives.
2. Rebuild `/` with **one responsive two-column hero**. Left text and right preview must render side by side on desktop.
3. Style the demo card using the approved Terra design; make all bid-like elements visibly nonfunctional.
4. End the page after the hero; use `#sample-auction` for the secondary CTA and omit the lower explanation section.
5. Verify layout at desktop and mobile sizes, lint, TypeScript and build. Report results and stop for review.

Implement this feature as a focused, reviewable change. If the current repository differs from these assumptions, report the conflict before adding unrelated features.

## 10. Acceptance criteria — must pass

- [ ] At **1280px and 1440px**, headline/CTAs appear **on the left** and auction card **on the right**, simultaneously, in **one hero row**.
- [ ] At **375px and 390px**, the content stacks in the order left text → right card, with no horizontal overflow.
- [ ] Shared `SiteHeader` appears exactly once and still works on desktop/mobile.
- [ ] Colors are **green/cream/amber**, not purple; typography uses **Literata headings and Nunito Sans body**.
- [ ] The `h1` has the three intended phrases and “Get bids.” is green.
- [ ] Primary CTA goes to `/auctions/new`; secondary CTA goes to the on-page sample card at `#sample-auction`. No “How it works” section or anchor remains.
- [ ] The auction preview shows the sample parking space, €145 highest bid, static 4h 12m, +€5 (€150)/+€10 (€155)/+€25 (€170) suggestions, a sample amount and disabled bidding action.
- [ ] Preview clearly says **“Sample auction · Preview only”**; no invented live user activity or validation claims.
- [ ] No real QR code, live countdown, working bid controls, auth, Supabase, APIs, or persistence.
- [ ] Existing Feature 01 primitives are reused, not duplicated; no new UI library.
- [ ] `npm run lint`, TypeScript check (`npx tsc --noEmit`) and `npm run build` pass, or any environment-related failure is accurately documented.
- [ ] Review at least one mobile and one desktop screenshot and state whether the two-column desktop layout was visually verified.
- [ ] Update `context/progress-tracker.md` **after** successful implementation and verification, distinguishing complete vs. pending work.

## 11. Definition of done

The homepage looks like **one coherent desktop hero with text left and sample auction right**, faithfully reflecting the reference's *composition*, while following QRBid's approved Terra brand and frontend-only rules. A visitor immediately understands what QRBid does, and no UI element falsely implies a working bidding system.
