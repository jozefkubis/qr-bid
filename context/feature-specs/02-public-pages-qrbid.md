# Feature 02 — QRBid Public Pages (UI Only)

**Status:** READY FOR REVIEW — implement only after Feature 01 is finished, verified, and approved.

## Goal

Create the first two visually complete, responsive QRBid pages using the approved Terra design system and the reusable UI primitives from Feature 01. This is a **UI-only milestone**: navigation between pages works, but auctions are not created or saved.

## Read before coding

1. Read `AGENTS.md` and the context documents it references, especially `context/ui-context.md`, `context/code-standards.md`, and `context/ai-workflow-rules.md`.
2. Read the implemented Feature 01 components and existing app structure. Reuse them; do not duplicate or replace them.
3. Follow the approved Terra design direction and any more detailed approved UI mockups in the repository. If this spec conflicts with an approved context document, flag the conflict before coding.

## Technology and visual direction

- Next.js App Router, React, TypeScript, Tailwind CSS.
- **No shadcn/ui**, Radix, sidebar framework, animation framework, or other new UI dependency.
- Use `lucide-react` only where icons genuinely improve clarity.
- Terra tokens from Feature 01: forest green `#4a7c59`, warm cream `#faf6f0`, restrained amber `#705c30`, Literata headings, Nunito Sans body.
- Warm, minimal, calm, mobile-first. Accessible contrast, visible keyboard focus, comfortable touch targets, semantic landmarks.
- UI copy in **English** for now. Functional internationalization remains separate. The later header refinement allows an explicitly disabled EN/SK preview labeled “Soon”.

## Scope A — Shared site header

Create `components/layout/site-header.tsx` (adapt naming to existing project conventions if necessary).

- Reusable on both pages.
- Brand/logo text **QRBid** on the left; clicking it navigates to `/`.
- Header remains visible while scrolling using `position: sticky`, `top: 0` and an opaque surface with sufficient stacking order. Preserve document flow, add anchor scroll clearance and avoid content jumping. Approved refinement on 2026-11-06.
- Desktop navigation: **Home**, a disabled EN/SK preview marked “Soon”, disabled **Sign in (soon)**, and a prominent green **Create an auction** link with an arrow. Use the expanded mobile menu below 1024px so these items remain usable without overflow. This is a UI-only refinement; no language state, persistence or authentication is added.
- On mobile, use a simple menu toggle with a clear accessible name, `aria-expanded`, and keyboard-operable links. Menu may expand beneath the header; no floating editor sidebar or complex overlay.
- Header uses a warm light surface and subtle bottom border, not the Ghost AI dark editor theme.
- The requested **Sign in** control is a native disabled button marked “(soon)”; it must not point at an invented sign-in route or pretend to authenticate. No sign-up, avatar, account menu or dashboard links.
- Keep the component simple; add client-side state only where needed for mobile menu interaction.

## Scope B — Landing page `/`

Build a concise, polished homepage, not a marketplace or analytics dashboard.

- Hero: clear headline about creating an online auction and sharing it with a QR code.
- Short explanatory sentence aimed at nontechnical users.
- Primary CTA **Create an auction**, linking to `/auctions/new`.
- A simple three-step explanation: **Create auction → Share QR code → Receive bids**.
- Optional small illustrative *static* auction preview built with normal UI elements if it improves comprehension; no fabricated live statistics, real auction listings, or functional bidding.
- Keep content intentionally short. No pricing plans, testimonials, FAQ, public auction directory, or marketing sections beyond this scope.

## Scope C — Create auction page `/auctions/new`

Build a responsive, visually polished **nonfunctional form prototype** using Feature 01's `Input`, `Textarea`, `Button`, and `Card` components.

Fields to display:

1. Auction title — text.
2. Description — multiline.
3. Photos — visually labeled placeholder area; **no file upload yet**.
4. Starting price — numeric field with a visible currency label (EUR as provisional display only).
5. Minimum bid increment — numeric field with currency label.
6. End date and time — native date/time input(s), visually aligned with the other fields; no timezone or deadline logic yet.

- Use appropriate visible labels, helper text where useful, and a sensible mobile-first layout.
- Form values may be typed locally, but **do not submit, persist, validate business rules, upload files, or call APIs**.
- Primary action should be explicitly disabled or labeled **Coming soon**; do not show a fake success message or imply an auction was created.
- Include a clear link back to the homepage.
- Do not implement Clerk authentication or access guards in this feature. Authentication behavior for this route will be decided and added separately.

## Routing and composition

- `/` → landing page.
- `/auctions/new` → create auction UI.
- Use the shared site header on both routes, preferably through a simple shared layout if the current structure makes that natural. Do not reorganize the entire app.
- Use Next.js `Link` for internal navigation.
- Do not add other routes, database tables, server actions, API routes, or mock backend services.

## Explicitly out of scope

- Clerk, registration, login, user profiles, authorization.
- Supabase, auction creation, storage, uploads, realtime updates.
- QR-code generation, PDF export, bidding, auction details, notifications.
- Full localization and language switcher.
- Editor navbar, project sidebar, tabs, dialogs, shadcn components.
- Complex form libraries or business validation.

## Implementation order — stop and verify each step

1. **Shared header only.** Implement and check desktop/mobile navigation and keyboard behavior.
2. **Landing page.** Implement hero, CTA, and three-step explanation; verify layout and links.
3. **Create auction prototype.** Add fields using Feature 01 primitives; verify mobile layout and that no data is submitted.

Do not proceed to the next step until the current step is reviewed. Keep changes small and report which files were changed.

## Acceptance checklist

- [ ] TypeScript compilation and lint pass using the repository's existing scripts.
- [ ] Both routes render without runtime errors.
- [ ] Header is shared and navigation works on desktop and mobile.
- [ ] Mobile menu is keyboard-operable and has correct accessible state.
- [ ] Terra styles, typography, and spacing are consistent with Feature 01.
- [ ] Layout remains usable on narrow mobile screens; no horizontal overflow.
- [ ] Create auction page shows all six requested field groups.
- [ ] No form submission, API calls, database writes, authentication, or real uploads.
- [ ] No new UI component library or unnecessary dependencies.

## Codex kickoff prompt (after approval)

Read `AGENTS.md`, the referenced context files, `feature-specs/01-design-system.md`, and this spec. Verify Feature 01 is implemented before starting. Implement **only Step 1: shared site header** from Feature 02. Use the existing Terra design tokens and existing UI primitives; do not install shadcn/ui or add unrelated features. Keep changes minimal, run the available checks, report changed files and results, then stop for review. Do not implement the landing page or create-auction page yet.
