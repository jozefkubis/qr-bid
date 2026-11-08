# Feature 07 — QRBid Authentication (Clerk Hybrid Modal)

**Status:** Approved for implementation specification; implementation and GitHub changes require a separate explicit user action.
**Project:** QRBid — Next.js App Router / TypeScript / Tailwind / Clerk
**UI language:** English
**Design:** Terra — light, minimal, responsive

## 1. Goal

Integrate the **existing, already configured Clerk application** into QRBid using **Clerk's built-in authentication UI**. Prefer a **sign-in/sign-up modal** when a user initiates authentication from the public site or auction flow. Also provide working dedicated routes `/sign-in` and `/sign-up` for direct links, OAuth callbacks, fallback, and recovery flows.

Keep QRBid's public landing page and public auction viewing accessible without authentication. Protect actions and private pages appropriately, without changing the existing product behavior beyond authentication.

## 2. Important prerequisites / non-negotiable constraints

1. **Inspect the repository first**: current Next.js version, route tree, `SiteHeader`, Terra tokens, installed Clerk packages, existing `proxy.ts` or `middleware.ts`, root layout, existing auth-related code, and package scripts.
2. Clerk is **already installed**, skills are present, and `.env.local` already contains keys for an **existing Clerk app**. **Do not run `clerk init`, create another Clerk app, relink to a different app, regenerate keys, or overwrite `.env.local`.**
3. Never read, print, commit, or expose secrets or full `.env.local` contents. Check only whether required variable names are present, if needed, without displaying values.
4. Do not install additional libraries unless genuinely necessary; confirm compatibility with the installed Clerk SDK generation before using `@clerk/ui`, themes, `Show`, `SignedIn`, or `SignedOut` APIs. **Do not add a dark theme.**
5. Preserve Terra design system and existing components; avoid a wholesale refactor.
6. Do not implement Supabase user synchronization, bidding authorization, onboarding, payments, or additional features in this task.
7. Work in small, reviewable steps; explain intended file changes before editing. No GitHub push/commit without user approval.

## 3. Approved UX decisions

- **Authentication UI:** Clerk prebuilt components, not hand-built password forms.
- **Primary presentation:** Clerk modal (`SignInButton` / `SignUpButton` with `mode="modal"`, or the SDK-supported equivalent).
- **Fallback/direct routes:** `/sign-in` and `/sign-up` render Clerk's prebuilt UI in a centered card.
- **Methods:** Email + password, Google, Facebook. These must be enabled/configured in the **Clerk Dashboard**; do not claim that code alone activates them. If Facebook OAuth requires extra configuration, report it clearly.
- **Visual style:** Terra light palette using existing CSS variables/design tokens where possible; no gradients, dark mode, giant hero, feature cards, or heavy customization of Clerk internals.
- **Responsive:** Modals usable on mobile; dedicated auth pages centered and compact. Preserve accessible focus, keyboard navigation, and sensible error messages through Clerk.
- **Signed-in menu:** Clerk `UserButton` in `SiteHeader`, retaining Clerk's built-in profile and logout flows.

## 4. Public and protected areas

### Public — must stay accessible when signed out

- `/` landing page — **never redirect to an editor or force sign-in**.
- Public auction detail pages and shareable QR links (discover exact paths in repository; do not invent a route).
- `/sign-in`, `/sign-up`, and any Clerk callback paths required by the installed SDK.
- Static assets and framework/internal paths as appropriate.

### Auth-required actions/pages

- Creating an auction (existing `/auctions/new` route, if confirmed).
- My Auctions / account-specific pages **only where those routes already exist**; do not invent a dashboard just for auth.
- Placing a bid will require auth in a future feature; for this feature, only wire existing entry points if present. **Do not implement bidding logic.**

**Important:** Don't use blanket protection of all non-auth routes: auction viewers must be able to open QR links anonymously. Protect server-side routes/actions as needed, not just buttons in the UI. Determine the exact matcher from real route structure before writing it.

## 5. Expected user flows

1. **Header, signed out:** Clicking **Sign in** opens the Clerk sign-in modal; registration is reachable from the same Clerk flow. If a distinct **Sign up** action already exists, it may open Clerk sign-up modal.
2. **Header, signed in:** Show Clerk `UserButton` instead of signed-out action(s). Keep current header styling and responsiveness.
3. **Create Auction, signed out:** Opening the protected flow should prompt sign-in and, on success, return to the originally requested destination (e.g. `/auctions/new`). Prefer a modal for UI entry points; retain route-based fallback for direct URL navigation.
4. **Public auction, signed out:** Auction details remain visible. If an existing **Place bid** action is present, it may open sign-in modal and retain the auction context; no bidding functionality is added.
5. **Direct `/sign-in` or `/sign-up`:** Full Clerk form renders, and transitions between sign-in and sign-up work.
6. **After sign-in:** Respect safe relative redirect/return URLs; otherwise go to a suitable existing page (prefer `/my-auctions` **only if it exists**, else `/`). Do not hardcode an unimplemented destination.
7. **Sign-out:** Clerk handles session termination; public pages remain usable.
8. **OAuth and recovery:** Google/Facebook and password reset should work with Clerk's supported redirects and fallback pages. Avoid custom authentication logic.

## 6. Technical approach

### Provider

- Integrate `ClerkProvider` into the existing Next.js root layout following the **installed SDK's official Next.js 16 guidance**.
- Preserve fonts, metadata, body classes, and current providers.
- If the installed SDK requires a particular placement or `Suspense` boundary, follow its actual API and current Next.js rendering constraints.

### Route protection

- Use root-level `proxy.ts` for Next.js 16, not `middleware.ts`, if no existing routing convention contradicts this.
- Use Clerk's supported `clerkMiddleware` and route matcher helpers for the installed version.
- Keep public landing/auth/auction-viewing routes accessible; protect confirmed private routes.
- Auth checks must also be enforced server-side in future mutations; `proxy.ts` is not a replacement for action-level authorization.

### Dedicated auth routes

- Create the route structure required by Clerk for App Router (catch-all segments where necessary).
- Render Clerk `<SignIn />` and `<SignUp />` using a simple Terra-styled centered layout.
- Use existing CSS variables/tokens to configure Clerk appearance; avoid hardcoded theme colors if existing tokens suffice.
- Avoid manual form fields, separate password handling, and custom social OAuth code.

### Header

- Reuse the existing `SiteHeader` and replace its current placeholder sign-in control with a working Clerk modal trigger.
- Add Clerk `UserButton` in the signed-in state.
- Avoid unnecessary conversion of large server components to client components; isolate client-only controls when appropriate.

### Environment

- Reuse existing Clerk environment variable names and values without exposing them.
- Do not add unnecessary new environment variables. If route URLs are required, first inspect existing configuration and document only genuinely missing **variable names**.

## 7. Deferred / explicitly out of scope

- Collecting/verifying phone numbers and completing full profile data for users signing up via email/Google/Facebook. Plan a separate minimal onboarding step before the first bid or auction creation; do not silently make unverified assumptions about social-profile data.
- Supabase ↔ Clerk identity mapping, RLS policy changes, or user-record synchronization.
- Bid creation, transaction validation, payment systems, notifications, or a new dashboard.
- Custom OAuth implementation or Clerk internal UI reimplementation.

## 8. Acceptance criteria

- [ ] Existing Clerk application reused; no new app or changed secrets.
- [ ] `ClerkProvider` integrated without breaking root layout.
- [ ] Sign in from header opens a functional Clerk modal.
- [ ] Registration reachable in Clerk flow; email/password, Google, and Facebook options display when configured in Dashboard.
- [ ] `/sign-in` and `/sign-up` work as dedicated fallback pages.
- [ ] Signed-in `UserButton` appears in the header; profile and sign-out work.
- [ ] Landing `/` remains public and unchanged in purpose.
- [ ] Public auction URLs remain accessible without authentication.
- [ ] Existing private create-auction route requires authentication and preserves a safe return destination.
- [ ] No invented routes, no custom auth logic, no accidental blanket route protection.
- [ ] Terra appearance works on desktop and mobile.
- [ ] TypeScript checks and `npm run build` pass; report actual results, not assumptions.
- [ ] Manual smoke test: signed out, sign-in modal, direct auth routes, sign-up, OAuth options, sign-out, protected-route redirect, anonymous auction view.

## 9. Suggested incremental implementation sequence for Codex

**Step 1 — Inspect and report:** List existing relevant files/routes, Clerk SDK version, Next.js version, and proposed changes. Stop for approval if there are architectural conflicts.

**Step 2 — Core Clerk integration:** Provider, minimal route protection with accurate public-route matchers, dedicated auth pages. Run build and test direct URLs.

**Step 3 — Header/modal integration:** Wire Sign in, Sign up flow, UserButton, and safe redirects/return paths. Test desktop/mobile.

**Step 4 — Verification and report:** Run `npm run build`, summarize changed files, identify any Clerk Dashboard actions needed for Google/Facebook, and flag follow-up work (onboarding and Supabase identity integration).

**Implementation note:** Do not interpret this specification as authorization to commit/push changes. Wait for the user's explicit instruction to start implementation.
