# Feature 08 — QRBid Internationalization (English / Slovak)

**Status:** Approved product specification; implementation requires a separate Codex run and review.  
**Project:** QRBid — Next.js App Router, TypeScript, Tailwind CSS, Clerk, Terra design.  
**Scope:** Localize the existing user interface and authentication UX. No new auction/business features.

## 1. Goal

Make QRBid genuinely bilingual (EN/SK) with language-prefixed URLs, a working language switcher, translated UI text and validation messages, and Clerk authentication UI in the selected language. English is the fallback language. Preserve the existing public landing page, unlisted auction links, and the hybrid Clerk modal + dedicated-page authentication from Feature 07.

**Important:** The current repository may lag behind local implementation. Inspect the actual working tree and confirm Feature 07 status before changing code. Do not assume a route, component, or dependency exists because it appears in a plan.

## 2. Approved locale behavior

Supported locales: `en`, `sk`. Default/fallback: `en`.

Priority:

1. **Explicit locale in URL wins**: `/sk/...` is Slovak, `/en/...` is English, irrespective of cookie, browser language, or account preference.
2. **At an unprefixed URL** (for example `/` or a legacy `/auctions/new`): if the user previously selected a locale, use the saved preference cookie.
3. **If no saved preference**: inspect the browser's `Accept-Language`; prefer `sk` when Slovak is explicitly preferred; prefer `en` for English; all other languages fall back to `en`. Use a deterministic locale negotiation strategy and document it. Do not treat Czech as Slovak unless separately approved.
4. **Fallback**: `en`.

Examples:

| Request | Result |
| --- | --- |
| `/sk` | Slovak landing page |
| `/en` | English landing page |
| `/` with `sk` browser, no cookie | Redirect to `/sk` |
| `/` with `en` browser, no cookie | Redirect to `/en` |
| `/` with `de` browser, no cookie | Redirect to `/en` |
| `/` with saved `sk` cookie | Redirect to `/sk` |
| `/en/auctions/new` with saved `sk` cookie | Keep `/en/auctions/new` |
| `/sk/auctions/abc` | Slovak UI for that same auction |

Use a cookie for remembered manual selection (appropriate `sameSite`, path and secure handling). A deliberate URL visit must never be overridden by a conflicting cookie. For future root visits, explicit locale selection should be remembered; avoid silently overwriting a manual preference just because someone opened a shared localized link. No account-profile persistence is required in this feature.

## 3. Routing and library

- Prefer `next-intl` compatible with the **installed** Next.js version and App Router. Check package versions and official integration guidance before installation. Do not install a second i18n library.
- Localized routes use **always-present locale prefixes**: `/en/...` and `/sk/...` (not `as-needed`).
- Keep route identifiers and dynamic auction IDs stable when changing locale; only the locale segment changes.
- Handle unprefixed legacy links via safe redirects where appropriate, including existing `/sign-in`, `/sign-up`, `/auctions/new` and any confirmed auction-detail paths. Do not create nonexistent auction pages.
- Preserve query parameters relevant to return URLs and OAuth callbacks; prevent open redirects. Avoid redirect loops and double locale prefixes.
- Inspect Next.js 16 `proxy.ts` and the existing Clerk `clerkMiddleware` before editing. Compose Clerk and locale routing correctly in **one** proxy entry point; do not create a competing `middleware.ts` or a second proxy. Clerk public route matchers must recognize both locale variants. Protect existing private pages/actions and leave the landing and auction-viewing pages public.
- Static assets, Next internals, Clerk callbacks and any confirmed webhook/API routes must not be broken by locale redirects. Do not localize opaque API paths or OAuth callback endpoints unless explicitly required by the installed SDK.
- Use the existing app structure; choose minimal route migration. If migrating route folders would be invasive, stop and report a concrete plan before proceeding.

## 4. Translation files and code standards

- Maintain exactly two source catalogs to start: `messages/en.json` and `messages/sk.json` (or equivalent standard `next-intl` location).
- Use **semantic, grouped keys** such as `Navigation.signIn`, `Landing.heroTitle`, `AuctionForm.startingPrice`, `Auth.signUp`, `Validation.required`.
- English is the reference catalog. Keep key parity, interpolate dynamic values safely, and use ICU-style pluralization for counts when needed.
- Never translate route IDs, code identifiers, database fields, or user-generated auction titles/descriptions. User-generated content stays as entered.
- Translate **all actual, currently implemented user-visible copy**: header, mobile menu, landing hero and sample, CTA/footer, create-auction form, placeholders, hints, empty/error/loading states, client-side validation, and any other existing pages. Inspect the repository to enumerate strings before editing; don't invent new features or routes to satisfy a checklist.
- Preserve accessible labels, alt text, page titles, descriptions, and other user-facing metadata in the selected locale. Set `<html lang>` correctly for the rendered page. Use locale-aware formatting for dates, numbers, currency and time where appropriate, without changing stored numeric values or auction business rules. Clearly show the applicable time zone in auction forms.
- Keep TypeScript and existing reusable UI primitives. Avoid hardcoded locale-specific ternaries scattered throughout JSX.

## 5. Language switcher (Terra UI)

- Replace the existing disabled EN/SK preview with a **working** switcher in the shared desktop header and mobile menu. Preserve the existing header/footer layout and Terra styles (green/cream, Literata/Nunito Sans).
- Switching from `/en/auctions/abc` goes to `/sk/auctions/abc`, and vice versa, retaining safe relevant query parameters. The current route should not reset to the landing page.
- Reflect active locale visibly and accessibly; use keyboard-accessible controls, clear labels, appropriate focus states and at least ~44px touch targets.
- Keep footer language controls consistent with header if the footer already includes a language preview. Avoid redundant language controls if they would clutter mobile UI.
- Do not claim unsaved form state is preserved across a full navigation. Prefer client-side locale navigation where feasible; if a partially completed Create Auction form could lose data, warn or protect against accidental loss using a minimal approach rather than silently discarding it. Do not add draft persistence or a new state-management library without approval.

## 6. Clerk authentication localization (Feature 07 compatibility)

- **Keep** hybrid authentication: Clerk modal for normal interactions, dedicated `/en/sign-in`, `/sk/sign-in`, `/en/sign-up`, `/sk/sign-up` for direct visits, recovery and redirects.
- Integrate Clerk's **supported localization API for the installed SDK generation**, including the required locale resources/package if necessary. Do not assume `next-intl` alone translates Clerk's built-in components.
- Ensure Clerk forms, button labels, validation/help text, sign-in/sign-up transitions and built-in user/profile UI use the selected locale as far as Clerk officially supports. Document any untranslated provider-controlled OAuth screens or incomplete Clerk translations rather than inventing unsupported overrides.
- Preserve configured email/password, Google and Facebook sign-in methods; do not alter the Clerk Dashboard settings or secrets.
- Maintain the selected locale when opening/closing a modal, switching between sign-in and sign-up, returning from OAuth, resetting a password, signing out, or navigating to an auth-protected route. Use safe relative return URLs and existing Clerk redirect conventions.
- Keep the Clerk `UserButton` and default profile/logout flows. Avoid reimplementing Clerk internals or replacing modal authentication with custom forms.
- Preserve public access to auction detail links; authentication remains required for private actions. Email verification, onboarding phone/name collection and database authorization remain separate concerns.

## 7. Implementation sequence — small, verifiable steps

**Step 0 — Audit only:** Inspect `package.json`, `app`/`src/app`, `proxy.ts`, Clerk provider, auth routes, SiteHeader, footer, `globals.css`, current text/validation/metadata, and any existing i18n configuration. Summarize the concrete file-change plan **before edits**. Confirm Feature 07 is integrated; if not, report the dependency and stop rather than inventing a parallel auth implementation.

**Step 1 — Routing foundation:** Add `next-intl` and locale configuration, EN/SK catalogs, and localized root routes with correct `<html lang>` and metadata. Integrate with the existing Clerk proxy without breaking auth. Verify `/`, `/en`, `/sk` and public/private route behavior.

**Step 2 — Existing UI translations:** Move all currently implemented copy into translation catalogs; translate faithfully, naturally, and consistently. No page redesign. Verify desktop/mobile and long Slovak labels.

**Step 3 — Switcher and preference:** Enable EN/SK controls, preserve current path and route params, implement cookie/browser selection and explicit-URL priority. Verify behavior with and without cookies.

**Step 4 — Clerk localization:** Connect Clerk locale to route locale, test modals and dedicated auth routes, OAuth redirect handling, `UserButton`, and auth-required navigation. Report any provider-side limitations.

**Step 5 — QA:** Run `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and targeted browser/manual tests. Fix issues, then report changes and known limitations. No automatic GitHub commit or push.

Do not implement the entire feature in one unreviewed sweep; after each meaningful step, show what changed and what was verified.

## 8. Acceptance tests

- [ ] `/sk` and `/en` render correct translations, including `<html lang>` and metadata.
- [ ] `/` chooses saved locale, then browser language, then EN fallback; explicit locale URL always wins.
- [ ] Unsupported language (e.g. German or Czech) falls back to EN when there is no saved preference.
- [ ] Switching EN ↔ SK keeps the same existing page and dynamic auction ID.
- [ ] Header/mobile/footer language controls are accessible, functional and styled in Terra.
- [ ] Every **existing** public UI string and existing form error/validation text is localized; EN/SK keys match.
- [ ] Dates, counts, and currency labels are formatted appropriately without changing auction values or time zone semantics.
- [ ] Clerk sign-in/sign-up modals and dedicated pages work in both languages.
- [ ] Email/password, Google and Facebook methods remain available as configured; OAuth return preserves a safe intended destination and locale.
- [ ] `UserButton`, logout, password recovery and auth route transitions continue to work.
- [ ] Public landing and unlisted auction pages remain public; private routes remain protected server-side.
- [ ] No redirect loops, duplicate proxies, secret changes, extra features, or new dashboards.
- [ ] Lint, TypeScript, production build and diff checks pass; mobile and desktop smoke tests pass.

## 9. Out of scope

- Automatic translation of auction titles/descriptions or user-generated content.
- Additional languages beyond EN/SK.
- Database schema, Supabase/Clerk identity mapping, profile language synchronization, new onboarding screens, bidding backend, notifications, payments, SEO content campaigns, or redesigned layouts.
- Replacing Clerk authentication, creating a new Clerk application, changing API keys, or deploying to production.

## 10. Instructions for Codex

Treat this document as the approved scope. First inspect the current **local** project state, not only GitHub, and compare with Feature 07. Before making changes, explain the planned steps and identify any blocker. Implement incrementally, verify each step, preserve Terra and existing UX, and ask for approval before any architectural expansion or GitHub commit/push. Do not print `.env.local` or secrets.
