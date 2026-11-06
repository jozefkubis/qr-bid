# Feature 05 — Final CTA + Site Footer (UI Only)

**Status:** READY FOR REVIEW — implement only after the preceding landing-page sections are verified.

## Goal

Complete the QRBid landing page with a strong final call-to-action (CTA) and a separate footer. Use the supplied screenshot as a **layout reference**, not as a source of approved brand colors, product promises, pricing, or functionality.

**Critical layout requirement:** The CTA belongs inside the **same overall final landing-page content section** (the content area immediately following “How QRBid works”), while the **footer is a distinct full-width `<footer>` element below that section**. The footer background must match the existing top `SiteHeader` background (`bg-surface` / `--surface`), not the CTA background. Do not merge footer content into the CTA card.

## Read before coding

- Read `AGENTS.md`, `DESIGN.md`, `context/ui-context.md`, `context/code-standards.md`, `context/ai-workflow-rules.md`, and `context/progress-tracker.md`.
- Inspect the current implementation of `/`, `SiteHeader`, and Features 01–04. Reuse existing components, spacing, color tokens, fonts and layout widths.
- If the landing page already has a CTA or footer, adapt it rather than rendering duplicates.
- Do not modify earlier approved sections unless strictly required to compose the page correctly.

## Screenshot analysis and adaptation

The reference shows a pale background around one large, horizontally centered, dark rounded CTA panel. Inside, left-aligned content includes a small eyebrow label, a large headline, a supporting paragraph, a primary button, and a short secondary note. Beneath the panel is a full-width footer with the brand and copyright on the left and several small links on the right. The screenshot uses navy/purple gradients and purple buttons, and includes marketing claims and footer destinations that are **not approved for QRBid**. Preserve its **hierarchy, spacing, and clear CTA/footer separation**, not those colors or claims.

## A — Final CTA section

### Position and structure

- Place the CTA **after** the “How QRBid works” content, before the footer.
- Use a semantic `<section>` with an accessible heading.
- The section may share the existing light landing-page content background; it must feel visually continuous with the preceding content, not like a separate unrelated page.
- Inside a centered `max-w-7xl` container (match the existing page), add **one large rounded CTA panel** with generous padding.
- Desktop: the panel spans most of the content width, with text grouped toward the left and comfortable open space to the right. Do not add an unapproved illustration or another auction card.
- Mobile: panel fills the available width with standard side gutters; text and button wrap naturally; no horizontal overflow.

### Terra colors and typography

- Use approved tokens only: `#4a7c59` primary, `#faf6f0` page background, `#705c30` restrained accent, plus existing `surface`, border and text tokens.
- Preferred panel treatment: **solid forest-green (`bg-primary`)** with high-contrast light text, or a subtle tonal treatment using already defined Terra colors. **No navy/purple gradient.** Check contrast for headline, description and CTA.
- Heading in Literata; paragraph and button in Nunito Sans. Rounded corners and subtle elevation consistent with Feature 01.
- CTA button must remain visually prominent on the green panel; use a contrasting light/cream button treatment with readable dark-green text. If the existing Button variants cannot support accessible contrast here, use a small local style override; do not expand the global design system without approval.

### Exact suggested English copy

- Optional eyebrow: `READY TO GET STARTED?` (no “Start in 60 seconds” claim).
- Heading: `Ready to create your first auction?`
- Supporting text: `Set up your auction, share a link or QR code, and let interested people place their bids.`
- Primary CTA: `Create an auction` → Next.js `Link` to `/auctions/new`.
- **Do not** show `Free for your first 3 micro-auctions`, `No credit card required`, `Instantly`, or other pricing/speed promises. The business model has not been approved.
- Keep this block intentionally short. No secondary CTA, fake metrics, email form or countdown.

## B — Separate footer

### Layout and color

- Render a separate semantic `<footer>` **outside and below** the CTA section, spanning the full viewport width.
- **Footer background must be identical to the existing top header**: reuse the same `bg-surface` token/class; use a subtle top border (`border-border`). Do not approximate with a new hardcoded cream.
- Inner content aligned to the same `max-w-7xl` container and horizontal gutters as the header and landing page.
- Desktop: compact horizontal brand/copyright group left and secondary content right, following the supplied footer reference. Mobile: groups wrap or stack with readable spacing; preserve approximately 44px targets. Use understated small body text, a dark serif brand and modest vertical padding. Approved refinement on 2026-11-06.
- Brand `QRBid` as text (no broken logo image); link to `/`.
- Copyright: `© {current year} QRBid SaaS. All rights reserved.` (year may be rendered from a server-safe date expression or set as appropriate; do not hardcode `2025`).

### Links and scope

- Do **not** add fake links to `Terms`, `Privacy`, `Documentation`, `Status`, `EN/SK`, or social profiles. Those pages/features are not yet implemented or approved.
- Screenshot refinement: show **Terms**, **Privacy**, **Status**, and **Documentation** as small native disabled buttons with a visible “Coming soon” group note; these are previews, never anchors to nonexistent pages. Do not show a green operational-status indicator. Follow with a slim divider and the shared disabled EN/SK preview marked “Soon”.
- Show EN as the current English language and SK as a future option; both preview buttons are disabled. Do not change language state or pretend translations are implemented.
- Any future legal links must be added when their actual routes and content are approved.

## UI-only constraints

- No Supabase, Clerk, Resend, database reads/writes, QR generation, bid submission, analytics, or network requests.
- The CTA is only a navigation link to the existing UI-only `/auctions/new` page; it must not claim that auctions can currently be published.
- Do not install shadcn/ui, Radix, new UI frameworks or animation libraries.
- Use existing Next.js App Router, React, TypeScript, Tailwind and existing components; use `lucide-react` only if essential.
- Keep all visible copy in English; no functional i18n yet.

## Implementation order

1. Inspect current page composition and existing shared layout. Identify where Feature 04 ends.
2. Add **only** the final CTA section, verify its desktop/mobile composition and color contrast.
3. Add the **separate footer** with the exact header background token, verify responsive behavior.
4. Run checks and report results. Update `context/progress-tracker.md` **after verification**, not before.

## Acceptance criteria

- [ ] On desktop, the CTA is one wide rounded panel centered below “How QRBid works”, with content left-aligned and generous whitespace.
- [ ] CTA section is visually continuous with the preceding landing-page content; the footer is a **distinct block** below it.
- [ ] Footer has **exactly the same background token as `SiteHeader`** and a subtle top border.
- [ ] No purple/navy styling, unsupported product/pricing claims, fake live features or dead footer links.
- [ ] `Create an auction` navigates to `/auctions/new` without submitting data.
- [ ] Terra tokens, Literata/Nunito Sans, spacing and button styles are consistent with previous features.
- [ ] At ~375px mobile and ~1280–1440px desktop, layout is readable, without horizontal scrolling or overlapping elements.
- [ ] Keyboard focus is visible; semantic section, heading, link and footer structure are correct.
- [ ] TypeScript, lint and production build checks pass (or any environment limitations are reported explicitly).
- [ ] Changed files and check results are summarized; progress tracker reflects only verified work.

## Explicit non-goals

No new pages, pricing model, legal documents, user accounts, auction data, extra marketing sections or backend functionality. Header UI refinements are documented in Feature 02; language and sign-in previews remain disabled pending a separate implementation decision. Do not redesign Features 01–04.
